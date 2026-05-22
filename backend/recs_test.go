package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"steamquack/backend/config"
	"steamquack/backend/database"
	"steamquack/backend/steam"
)

func TestRecommendationsHandler(t *testing.T) {
	cfg := config.LoadConfig()
	database.InitDatabase(cfg)
	defer database.CloseDatabase()
	t.Log("Database initialized")

	// 1. Setup the test payload
	testReq := RecommendationRequest{
		Profile: "76561198998662393",
		Settings: steam.Settings{
			ExcludedTags:            []string{},
			ExcludedGames:           []uint32{},
			PrioritizedTags:         []string{},
			PrioritizedGames:        []uint32{},
			PrioritizeGamesOnSale:   false,
			PriceFloor:              0.0,
			PriceCeiling:            100.0,
			ReviewCountFloor:        0,
			ReviewCountCeiling:      1000000,
			ReviewPercentageFloor:   0.0,
			ReviewPercentageCeiling: 100.0,
			ReleaseYearFloor:        0,
			ReleaseYearCeiling:      1767225600,
			RandomizationFactor:     0.0,
		},
	}

	payload, err := json.Marshal(testReq)
	if err != nil {
		t.Fatalf("Failed to marshal request payload: %v", err)
	}

	// 2. Create an HTTP request to pass to our handler
	req, err := http.NewRequest("POST", "/api/recommendations", bytes.NewBuffer(payload))
	if err != nil {
		t.Fatalf("Failed to create HTTP request: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")

	// 3. Create a ResponseRecorder to capture the handler's response
	rr := httptest.NewRecorder()

	// 4. Call the handler directly
	recommendationsHandler(rr, req)

	// 5. Check the HTTP status code
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("Handler returned wrong status code: got %v want %v", status, http.StatusOK)
		t.Fatalf("Response body: %s", rr.Body.String())
	}

	// 6. Decode and validate the response payload
	var resp RecommendationResponse
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("Failed to decode response JSON: %v", err)
	}

	// 7. Assertions on the generated recommendations
	t.Logf("Recommendations received: %d", len(resp.Recommendations))

	if len(resp.Recommendations) == 0 {
		t.Fatalf("Error: no recommendations returned.")
	}
}
