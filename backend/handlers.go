package main

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"

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
			if err := steamService.ScrapeGameData(count); err != nil {
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
