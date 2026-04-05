package main

import (
	"encoding/json"
	"net/http"
	"steamquack/backend/config"
	"steamquack/backend/database"
	"steamquack/backend/steam"
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

func profileParseHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var req ProfileParseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "invalid json"})
		return
	}

	steamID := req.Profile
	if steamID == "" {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "steam id required"})
		return
	}

	cfg := config.LoadConfig()
	db := database.GetDB()
	steamService := steam.NewScrapingService(cfg, db)
	defer steamService.Close()

	playerSummary, err := steamService.GetUserProfile(steamID)
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
		ownedGames, err := steamService.GetUserOwnedGames(steamID)
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