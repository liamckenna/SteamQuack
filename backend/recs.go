package main

import (
	"encoding/json"
	"net/http"
)

type RecommendationRequest struct {
	Profile  string         `json:"profile"`
	Settings map[string]any `json:"settings"`
}

type Recommendation struct {
	Title  string `json:"title"`
	Reason string `json:"reason"`
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

	//dummy recommendations
	resp := RecommendationResponse{
		Recommendations: []Recommendation{
			{Title: "[game 1]", Reason: "[reason]"},
			{Title: "\n[game 2]", Reason: "[reason]" + "[" + req.Profile + "]"},
		},
	}

	_ = json.NewEncoder(w).Encode(resp)
}