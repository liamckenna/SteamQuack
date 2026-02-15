package main

import (
	"encoding/json"
	"log"
	"net/http"

	"steamquack/backend/config"
	"steamquack/backend/database"

	"github.com/gorilla/mux"
)

func main() {
	// Load configuration
	cfg := config.LoadConfig()

	// Initialize the database(creates tables if they don't exist)
	database.InitDatabase()
	defer database.CloseDatabase()

	// Set up API routes
	r := mux.NewRouter()
	r.HandleFunc("/api/health", healthHandler).Methods(http.MethodGet)

	log.Printf("Steam API Key loaded: %s...", cfg.SteamAPIKey[:8])
	log.Println("Database initialized")
	log.Printf("API server running on http://localhost:%s", cfg.ServerPort)
	log.Fatal(http.ListenAndServe(":"+cfg.ServerPort, r))
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]bool{
		"ok": true,
	})
}
