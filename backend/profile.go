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

	playerSummary, err := steamService.GetUserProfile(steamID)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "failed to fetch user profile"})
		return
	}

	visibility := playerSummary.Visibility

	if visibility != 3 {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Private profile!"})
		return
	}

	ownedGames, err := steamService.GetUserOwnedGames(steamID)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "failed to fetch owned games"})
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

	_ = json.NewEncoder(w).Encode(ProfileResult{
		Status:  "[public]",
		Name:    playerSummary.PersonaName,
		Picture: playerSummary.Avatar,
		Summary: map[string]any{
			"games_count": len(userGames),
			"games":       userGames,
		},
	})

	steamService.Close()
}
