package main

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"

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
