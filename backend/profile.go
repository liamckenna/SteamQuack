package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"steamquack/backend/config"
	"steamquack/backend/database"
	"steamquack/backend/steam"
	"strings"
)

type ProfileParseRequest struct {
	Profile string `json:"profile"`
}

type ProfileResult struct {
	Status  string `json:"status"` //"notFound, private, public"
	Name    string `json:"name,omitempty"`
	Picture string `json:"picture,omitempty"`
	Summary any    `json:"summary,omitempty"`
	SteamID string `json:"steam_id,omitempty"`
}

func resolveSteamProfileInput(input string) (string, error) {
	input = strings.TrimSpace(input)
	if input == "" {
		return "", fmt.Errorf("steam id required")
	}

	//numeric SteamID
	if isNumeric(input) {
		return input, nil
	}

	//full URL
	if strings.HasPrefix(input, "http://") || strings.HasPrefix(input, "https://") {
		return resolveSteamURL(input)
	}

	//plain vanity username
	return resolveVanityProfile(input)
}

func resolveSteamURL(raw string) (string, error) {
	u, err := url.Parse(raw)
	if err != nil {
		return "", fmt.Errorf("invalid steam profile input")
	}

	if !strings.Contains(u.Host, "steamcommunity.com") {
		return "", fmt.Errorf("invalid steam community url")
	}

	path := strings.Trim(u.Path, "/")
	parts := strings.Split(path, "/")
	if len(parts) < 2 {
		return "", fmt.Errorf("invalid steam profile path")
	}

	switch parts[0] {
	case "profiles":
		steamID := parts[1]
		if !isNumeric(steamID) {
			return "", fmt.Errorf("invalid numeric steam id in profile url")
		}
		return steamID, nil

	case "id":
		return resolveVanityProfile(parts[1])

	default:
		return "", fmt.Errorf("unsupported steam profile url")
	}
}

func resolveVanityProfile(profile string) (string, error) {
	cfg := config.LoadConfig()
	key := cfg.SteamAPIKey
	resp, err := http.Get("https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=" + key + "&vanityurl=" + profile)

	if err != nil {
		return "", fmt.Errorf("failed to fetch vanity profile")
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("failed to fetch vanity profile")
	}

	contentType := resp.Header.Get("Content-Type")
	if !strings.Contains(contentType, "application/json") {
		return "", fmt.Errorf("steam API returned non-JSON response for profile")
	}

	var decodedResp steam.SteamResolveVanityURLResponse
	if err := json.NewDecoder(resp.Body).Decode(&decodedResp); err != nil {
		return "", fmt.Errorf("failed to decode steam JSON response")
	}

	if decodedResp.Response.Success != 1 {
		return "", fmt.Errorf("steam profile not found")
	}

	return decodedResp.Response.SteamID, nil
}

func isNumeric(s string) bool {
	if s == "" {
		return false
	}
	for _, ch := range s {
		if ch < '0' || ch > '9' {
			return false
		}
	}
	return true
}

func profileParseHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var req ProfileParseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "invalid json"})
		return
	}

	input := strings.TrimSpace(req.Profile)
	if input == "" {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "profile input required"})
		return
	}

	resolvedSteamID, err := resolveSteamProfileInput(input)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	cfg := config.LoadConfig()
	db := database.GetDB()
	steamService := steam.NewScrapingService(cfg, db)

	playerSummary, err := steamService.GetUserProfile(resolvedSteamID)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "failed to fetch user profile"})
		return
	}

	isPublic := playerSummary.Visibility == 3

	response := map[string]any{
		"status":   "[ok]",
		"steam_id": playerSummary.SteamID,
		"name":     playerSummary.PersonaName,
		"picture":  playerSummary.AvatarFull,
		"public":   isPublic,
	}

	if isPublic {
		ownedGames, err := steamService.GetUserOwnedGames(resolvedSteamID)
		if err == nil {
			userGames := make([]map[string]interface{}, 0)
			for _, game := range ownedGames.Response.Games {
				userGames = append(userGames, map[string]interface{}{
					"app_id":           game.AppID,
					"name":             game.Name,
					"playtime_forever": game.PlaytimeForever,
				})
			}
			response["summary"] = map[string]any{
				"games_count": len(userGames),
				"games":       userGames,
			}
		}
	}

	_ = json.NewEncoder(w).Encode(response)
}
