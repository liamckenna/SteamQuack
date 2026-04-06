package main

import (
	"encoding/json"
	"net/http"
	"steamquack/backend/algorithm"
	"steamquack/backend/config"
	"steamquack/backend/database"
	"steamquack/backend/steam"
)

type RecommendationRequest struct {
	Profile  string         `json:"profile"`
	Settings map[string]any `json:"settings"`
}

type Recommendation struct {
	GameID uint32  `json:"game_id"`
	Score  float64 `json:"score"`
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
	//error testing here

	cfg := config.LoadConfig()
	db := database.GetDB()
	steamService := steam.NewScrapingService(cfg, db)

	userTasteProfile := algorithm.CreateTasteProfile(steamService, steamID)

	topGames := algorithm.CreateRecommendations(steamService, userTasteProfile, req.Settings)

	recommendations := make([]Recommendation, 0, len(topGames))
	for _, gameScore := range topGames {
		recommendations = append(recommendations, Recommendation{
			GameID: gameScore.GameID,
			Score:  gameScore.Score,
		})
	}
	resp := RecommendationResponse{
		Recommendations: recommendations,
	}

	_ = json.NewEncoder(w).Encode(resp)
}
