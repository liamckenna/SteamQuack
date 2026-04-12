package main

import (
	"encoding/json"
	"math"
	"net/http"
	"steamquack/backend/algorithm"
	"steamquack/backend/config"
	"steamquack/backend/database"
	"steamquack/backend/steam"
	"time"
)

type RecommendationRequest struct {
	Profile  string         `json:"profile"`
	Settings steam.Settings `json:"settings"`
}

type Recommendation struct {
	GameID uint32  `json:"game_id"`
	Score  float64 `json:"score"`
	Name   string  `json:"name"`
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

	ownedGames, err2 := steamService.GetUserOwnedGames(steamID)
	if err2 != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "failed to fetch owned games"})
		return
	}

	ownedGameIDs := make([]uint32, 0, len(ownedGames.Response.Games))

	settings := steam.Settings{
		ExcludedGames:           make([]uint32, 0),
		ExcludedTags:            make([]string, 0),
		PrioritizedTags:         make([]string, 0),
		PrioritizedGames:        make([]uint32, 0),
		PrioritizeGamesOnSale:   false,
		PriceFloor:              0.00,
		PriceCeiling:            math.MaxFloat64,
		ReviewCountFloor:        0,
		ReviewCountCeiling:      math.MaxInt,
		ReviewPercentageFloor:   0.0,
		ReviewPercentageCeiling: math.MaxFloat64,
		ReleaseYearFloor:        1970,              //default to Jan 1, 1970
		ReleaseYearCeiling:      time.Now().Year(), //default to now
		RandomizationFactor:     0.0,
	}

	inputtedSettings := req.Settings

	if len(inputtedSettings.ExcludedGames) > 0 {
		settings.ExcludedGames = inputtedSettings.ExcludedGames
	}
	if len(inputtedSettings.ExcludedTags) > 0 {
		settings.ExcludedTags = inputtedSettings.ExcludedTags
	}
	if len(inputtedSettings.PrioritizedTags) > 0 {
		settings.PrioritizedTags = inputtedSettings.PrioritizedTags
	}
	if len(inputtedSettings.PrioritizedGames) > 0 {
		settings.PrioritizedGames = inputtedSettings.PrioritizedGames
	}
	if inputtedSettings.PrioritizeGamesOnSale {
		settings.PrioritizeGamesOnSale = inputtedSettings.PrioritizeGamesOnSale
	}
	if inputtedSettings.PriceFloor != 0.0 {
		settings.PriceFloor = inputtedSettings.PriceFloor
	}
	if inputtedSettings.PriceCeiling != 0.0 {
		settings.PriceCeiling = inputtedSettings.PriceCeiling
	}
	if inputtedSettings.ReviewCountFloor != 0 {
		settings.ReviewCountFloor = inputtedSettings.ReviewCountFloor
	}
	if inputtedSettings.ReviewCountCeiling != 0 {
		settings.ReviewCountCeiling = inputtedSettings.ReviewCountCeiling
	}
	if inputtedSettings.ReviewPercentageFloor != 0.0 {
		settings.ReviewPercentageFloor = inputtedSettings.ReviewPercentageFloor
	}
	if inputtedSettings.ReviewPercentageCeiling != 0.0 {
		settings.ReviewPercentageCeiling = inputtedSettings.ReviewPercentageCeiling
	}
	if inputtedSettings.ReleaseYearFloor != 0 {
		settings.ReleaseYearFloor = inputtedSettings.ReleaseYearFloor
	}
	if inputtedSettings.ReleaseYearCeiling != 0 {
		settings.ReleaseYearCeiling = inputtedSettings.ReleaseYearCeiling
	}
	if inputtedSettings.RandomizationFactor != 0.0 {
		settings.RandomizationFactor = inputtedSettings.RandomizationFactor
	}

	for game := range ownedGames.Response.Games {
		ownedGameIDs = append(ownedGameIDs, ownedGames.Response.Games[game].AppID)
	}

	// add excluded games to count as owned game to filter them out
	ownedGameIDs = append(ownedGameIDs, settings.ExcludedGames...)

	userTasteProfile := algorithm.CreateTasteProfile(steamService, steamID, settings)

	topGames := algorithm.CreateRecommendations(steamService, userTasteProfile, ownedGameIDs, settings)

	recommendations := make([]Recommendation, 0, len(topGames))
	for _, gameScore := range topGames {
		recommendations = append(recommendations, Recommendation{
			GameID: gameScore.GameID,
			Score:  gameScore.Score,
			Name:   gameScore.Name,
		})
	}
	resp := RecommendationResponse{
		Recommendations: recommendations,
	}

	_ = json.NewEncoder(w).Encode(resp)

	steamService.Close()
}
