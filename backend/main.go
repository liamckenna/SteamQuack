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

func main() {
	cfg := config.LoadConfig()
	database.InitDatabase()
	defer database.CloseDatabase()

	log.Println("Database initialized")
	db := database.GetDB()
	steamService := steam.NewScrapingService(cfg, db)
	defer steamService.Close()

	// set up DB update scheduler
	updateService := update.NewUpdateService(steamService, db)
	scheduler := update.NewScheduler(updateService)
	scheduler.Start()
	defer scheduler.Stop()

	// set up API routes
	r := mux.NewRouter()
	r.HandleFunc("/api/health", healthHandler).Methods(http.MethodGet)

	//frontend sends backend profile string
	r.HandleFunc("/api/profile/parse", profileParseHandler).Methods(http.MethodPost)
	r.HandleFunc("/api/recommendations", recommendationsHandler).Methods(http.MethodPost)

	// scraping endpoints
	r.HandleFunc("/api/scrape/games/{count}", ScrapeGamesHandler(steamService)).Methods("POST")              // scrapes multiple games (1-100)
	r.HandleFunc("/api/scrape/game/{appid}", ScrapeSpecificGameHandler(steamService)).Methods("POST")        // scrapes a specific game
	r.HandleFunc("/api/user/profile/{steamid}", GetUserProfileHandler(steamService)).Methods(http.MethodGet) // scrapes user profile and owned games
	r.HandleFunc("/api/stats", StatsHandler(steamService)).Methods("GET")                                    // gets scraping statistics

	// start server
	log.Printf("Available endpoints:")
	log.Printf("  GET  /api/health - Health check")
	log.Printf("API server running on http://localhost:%s", cfg.ServerPort)
	log.Fatal(http.ListenAndServe(":"+cfg.ServerPort, r))
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]bool{
		"ok": true,
	})
}
