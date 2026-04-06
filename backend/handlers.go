package main

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"net/url"
	"regexp"
	"strconv"
	"strings"

	"steamquack/backend/database"
	"steamquack/backend/steam"

	"github.com/gorilla/mux"
)

func ScrapeGamesHandler(steamService *steam.ScrapingService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		count, err := strconv.Atoi(vars["count"])
		if err != nil || count <= 0 || count > 100 {
			http.Error(w, "Invalid count (must be 1-100)", http.StatusBadRequest)
			return
		}

		log.Printf("Starting scraping of %d games", count)
		go func() {
			if err := steamService.ScrapeGameData(count, 0); err != nil {
				log.Printf("Scraping error: %v", err)
			}
		}()

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"message": "Scraping started",
			"count":   vars["count"],
		})
	}
}

func ScrapeSpecificGameHandler(steamService *steam.ScrapingService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		appID, err := strconv.ParseUint(vars["appid"], 10, 32)
		if err != nil {
			http.Error(w, "Invalid App ID", http.StatusBadRequest)
			return
		}

		game, err := steamService.ScrapeSpecificGame(uint32(appID))
		if err != nil {
			http.Error(w, "Failed to scrape game: "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(game)
	}
}

func StatsHandler(steamService *steam.ScrapingService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		stats, err := steamService.GetScrapingStats()
		if err != nil {
			http.Error(w, "Failed to get stats: "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(stats)
	}
}

func GetUserProfileHandler(steamService *steam.ScrapingService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		steamID := vars["steamid"]

		if steamID == "" {
			http.Error(w, "Steam ID is required", http.StatusBadRequest)
			return
		}

		// gets user profile for display as well as their owned games
		playerSummary, err := steamService.GetUserProfile(steamID)
		if err != nil {
			http.Error(w, "Failed to fetch user profile", http.StatusInternalServerError)
			return
		}

		ownedGames, err := steamService.GetUserOwnedGames(steamID)
		if err != nil {
			http.Error(w, "Failed to fetch owned games", http.StatusInternalServerError)
			return
		}

		userGames := make([]map[string]interface{}, 0)
		for _, game := range ownedGames.Response.Games {
			userGames = append(userGames, map[string]interface{}{
				"app_id":           game.AppID,
				"name":             game.Name,
				"playtime_forever": game.PlaytimeForever,
			})
		}

		response := map[string]interface{}{
			"user": map[string]string{
				"steam_id":     playerSummary.SteamID,
				"persona_name": playerSummary.PersonaName,
				"avatar":       playerSummary.Avatar,
			},
			"owned_games_count": len(userGames),
			"owned_games":       userGames,
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}
}

func optionsHandler(w http.ResponseWriter, r *http.Request) {
	db := database.GetDB()
	var tags []string
	var games []struct {
		ID   uint32 `json:"id"`
		Name string `json:"name"`
	}

	db.Table("game_tags").Distinct("tag_name").Pluck("tag_name", &tags)
	db.Table("games").Select("app_id as id, name").Find(&games)

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"tags":  tags,
		"games": games,
	})
}
func SteamLoginHandler(w http.ResponseWriter, r *http.Request) {
	params := url.Values{}
	params.Set("openid.ns", "http://specs.openid.net/auth/2.0")
	params.Set("openid.mode", "checkid_setup")
	params.Set("openid.claimed_id", "http://specs.openid.net/auth/2.0/identifier_select")
	params.Set("openid.identity", "http://specs.openid.net/auth/2.0/identifier_select")
	params.Set("openid.return_to", "http://localhost:8080/auth/steam/callback")
	params.Set("openid.realm", "http://localhost:8080/")

	loginURL := "https://steamcommunity.com/openid/login?" + params.Encode()
	http.Redirect(w, r, loginURL, http.StatusFound)
}

func SteamCallbackHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("Steam callback hit")
	log.Println("Full callback URL:", r.URL.String())

	query := r.URL.Query()

	if query.Get("openid.mode") == "cancel" {
		log.Println("Steam sign-in cancelled")
		http.Error(w, "Steam sign-in was cancelled", http.StatusUnauthorized)
		return
	}

	form := url.Values{}
	for key, values := range query {
		for _, value := range values {
			form.Add(key, value)
		}
	}
	form.Set("openid.mode", "check_authentication")

	resp, err := http.PostForm("https://steamcommunity.com/openid/login", form)
	if err != nil {
		log.Println("PostForm error:", err)
		http.Error(w, "Failed to verify Steam login", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Println("ReadAll error:", err)
		http.Error(w, "Failed to read Steam verification response", http.StatusInternalServerError)
		return
	}

	body := string(bodyBytes)
	log.Println("Steam verification response:", body)

	if !strings.Contains(body, "is_valid:true") {
		log.Println("Steam verification failed")
		http.Error(w, "Invalid Steam login response", http.StatusUnauthorized)
		return
	}

	claimedID := query.Get("openid.claimed_id")
	log.Println("Claimed ID:", claimedID)

	re := regexp.MustCompile(`^https?://steamcommunity\.com/openid/id/(\d+)$`)
	matches := re.FindStringSubmatch(claimedID)
	if len(matches) != 2 {
		log.Println("Could not extract Steam ID")
		http.Error(w, "Could not extract Steam ID", http.StatusUnauthorized)
		return
	}

	steamID := matches[1]
	log.Println("Authenticated SteamID:", steamID)

	http.Redirect(w, r, "http://localhost:5173/?steamid="+steamID, http.StatusFound)
}

func GetSteamAuthUserHandler(steamService *steam.ScrapingService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		steamID := vars["steamid"]

		if steamID == "" {
			http.Error(w, "Steam ID is required", http.StatusBadRequest)
			return
		}

		playerSummary, err := steamService.GetUserProfile(steamID)
		if err != nil {
			http.Error(w, "Failed to fetch Steam user", http.StatusInternalServerError)
			return
		}

		response := map[string]interface{}{
			"user": map[string]string{
				"steam_id":     playerSummary.SteamID,
				"persona_name": playerSummary.PersonaName,
				"avatar":       playerSummary.AvatarFull,
			},
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}
}
