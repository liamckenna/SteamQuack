package main

import (
	"encoding/json"
	"net/http"
	"steamquack/backend/algorithm"
	"steamquack/backend/config"
	"steamquack/backend/database"
	"steamquack/backend/models"
	"steamquack/backend/steam"
)

type RecommendationRequest struct {
	Profile  string         `json:"profile"`
	Settings steam.Settings `json:"settings"`
}

type Recommendation struct {
	GameID           uint32  `json:"game_id"`
	Score            float64 `json:"score"`
	Name             string  `json:"name"`
	Description      string  `json:"description"`
	InitialPrice     float64 `json:"initial_price"`
	CurrentPrice     float64 `json:"current_price"`
	ReleaseDateUnix  int64   `json:"release_date_unix"`
	ReviewCount      int     `json:"review_count"`
	ReviewPercentage float64 `json:"review_percentage"`
}

type RecommendationResponse struct {
	Recommendations []Recommendation `json:"recommendations"`
}

func recommendationsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var req RecommendationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "invalid json"})
		return
	}

	steamID := req.Profile

	cfg := config.LoadConfig()
	db := database.GetDB()
	steamService := steam.NewScrapingService(cfg, db)

	ownedGames, err2 := steamService.GetUserOwnedGames(steamID)
	if err2 != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "failed to fetch owned games"})
		return
	}

	settings := req.Settings

	userTasteProfile := algorithm.CreateTasteProfile(steamService, steamID, settings)

	for game := range ownedGames.Response.Games {
		settings.ExcludedGames = append(settings.ExcludedGames, ownedGames.Response.Games[game].AppID)
	}

	topGames := algorithm.CreateRecommendations(steamService, userTasteProfile, settings)

	recommendations := make([]Recommendation, 0, len(topGames))
	for _, gameScore := range topGames {
		var game models.Game
		if err := db.Where("app_id = ?", gameScore.GameID).Find(&game).Error; err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": "failed to fetch games"})
			return
		}
		recommendations = append(recommendations, Recommendation{
			GameID:           gameScore.GameID,
			Score:            gameScore.Score,
			Name:             gameScore.Name,
			Description:      game.Description,
			InitialPrice:     game.InitialPrice,
			CurrentPrice:     game.CurrentPrice,
			ReleaseDateUnix:  game.ReleaseDateUnix,
			ReviewCount:      game.ReviewCount,
			ReviewPercentage: game.ReviewPercentage,
		})
	}
	resp := RecommendationResponse{
		Recommendations: recommendations,
	}

	_ = json.NewEncoder(w).Encode(resp)

	steamService.Close()
}
