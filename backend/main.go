package main

import (
	"encoding/json"
	"log"
	"net/http"

	"steamquack/backend/config"
	"steamquack/backend/database"
	"steamquack/backend/steam"
	"steamquack/backend/update"

	"github.com/gorilla/mux"
)

func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin == "http://localhost:5173" || origin == "http://localhost:5174" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
		}

		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func main() {
	cfg := config.LoadConfig()
	database.InitDatabase()
	defer database.CloseDatabase()

	log.Println("Database initialized")
	db := database.GetDB()
	steamService := steam.NewScrapingService(cfg, db)
	updateService := update.NewUpdateService(steamService, db)
	scheduler := update.NewScheduler(updateService)
	scheduler.Start()
	defer scheduler.Stop()

	// set up API routes
	r := mux.NewRouter()
	r.HandleFunc("/api/health", healthHandler).Methods(http.MethodGet)
	r.HandleFunc("/api/preferences/options", optionsHandler).Methods(http.MethodGet)

	//frontend sends backend profile string
	r.HandleFunc("/api/profile/parse", profileParseHandler).Methods(http.MethodPost)
	r.HandleFunc("/api/recommendations", recommendationsHandler).Methods(http.MethodPost)

	// scraping endpoints
	r.HandleFunc("/api/scrape/games/{count}", ScrapeGamesHandler(steamService)).Methods("POST")              // scrapes multiple games (1-100)
	r.HandleFunc("/api/scrape/game/{appid}", ScrapeSpecificGameHandler(steamService)).Methods("POST")        // scrapes a specific game
	r.HandleFunc("/api/user/profile/{steamid}", GetUserProfileHandler(steamService)).Methods(http.MethodGet) // scrapes user profile and owned games
	r.HandleFunc("/api/user/diagnostics/{steamid}", DiagnosticsHandler(steamService)).Methods(http.MethodGet)
	r.HandleFunc("/api/stats", StatsHandler(steamService)).Methods("GET") // gets scraping statistics

	r.HandleFunc("/auth/steam/login", SteamLoginHandler).Methods(http.MethodGet)
	r.HandleFunc("/auth/steam/callback", SteamCallbackHandler).Methods(http.MethodGet)
	r.HandleFunc("/api/auth/steam-user/{steamid}", GetSteamAuthUserHandler(steamService)).Methods(http.MethodGet)

	// start server
	log.Printf("Available endpoints:")
	log.Printf("  GET  /api/health - Health check")
	log.Printf("API server running on http://localhost:%s", cfg.ServerPort)
	log.Fatal(http.ListenAndServe(":"+cfg.ServerPort, enableCORS(r)))
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]bool{
		"ok": true,
	})
}
