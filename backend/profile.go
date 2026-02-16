package main

import (
	"encoding/json"
	"net/http"
)

type ProfileParseRequest struct{
	Profile string `json:"profile"`
}

type ProfileResult struct{
	Status string `json:"status"` //"notFound, private, public"
	Name string `json:"name,omitempty"`
	Picture string `json:"picture,omitempty"`
	Summary any `json:"summary,omitempty"`
}

func profileParseHandler(w http.ResponseWriter, r *http.Request){
	w.Header().Set("Content-Type", "application/json")

	var req ProfileParseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "invalid json"})
		return
	}

	//dummy behavior (replace later with real Steam validation)
	switch req.Profile {
	case "notfound":
		w.WriteHeader(http.StatusNotFound)
		_ = json.NewEncoder(w).Encode(ProfileResult{
			Status: "[not found]",
		})
		return

	case "private":
		_ = json.NewEncoder(w).Encode(ProfileResult{
			Status:  "[private]",
			Name:    "[user name]",
			Picture: "[user image]",
		})
		return

	default:
		_ = json.NewEncoder(w).Encode(ProfileResult{
			Status:  "[public]",
			Name:    "[user name]",
			Picture: "[user image]",
			Summary: map[string]any{
				"[headline]": "[user profile summary]",
				"[games]":    42,
			},
		})
		return
	}
}