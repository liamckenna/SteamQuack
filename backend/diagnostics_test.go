package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"steamquack/backend/config"
	"steamquack/backend/database"
	"steamquack/backend/models"
	"steamquack/backend/steam"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// SetupTestDB creates an in-memory SQLite database for testing
func SetupTestDB() (*gorm.DB, error) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	err = db.AutoMigrate(
		&models.Game{},
		&models.GameTag{},
	)
	if err != nil {
		return nil, err
	}

	return db, nil
}

func TestDiagnosticsHandler(t *testing.T) {
	_ = godotenv.Load("../.env")

	db, err := SetupTestDB()
	if err != nil {
		t.Fatalf("Failed to setup test db: %v", err)
	}

	database.DB = db

	cfg := &config.Config{
		SteamAPIKey:  os.Getenv("STEAM_API_KEY"),
		DatabasePath: ":memory:",
		ServerPort:   "8080",
		FrontendURL:  "http://localhost:5173",
	}

	service := steam.NewScrapingService(cfg, db)

	req, err := http.NewRequest("GET", "/api/user/diagnostics/", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	router := mux.NewRouter()
	router.HandleFunc("/api/user/diagnostics/{steamid}", DiagnosticsHandler(service))
	router.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusNotFound && status != http.StatusMethodNotAllowed {
		t.Errorf("handler returned wrong status code for missing steamid: got %v", status)
	}

	req2, err := http.NewRequest("GET", "/api/user/diagnostics/invalid_steam_id", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr2 := httptest.NewRecorder()
	router.ServeHTTP(rr2, req2)

	if status := rr2.Code; status != http.StatusInternalServerError && status != http.StatusOK {
		t.Errorf("handler returned unexpected status code for invalid steamid: got %v", status)
	}

	// checks the response struct if OK
	if rr2.Code == http.StatusOK {
		var resp DiagnosticsResponse
		err = json.NewDecoder(rr2.Body).Decode(&resp)
		if err != nil {
			t.Fatalf("Failed to decode response: %v", err)
		}

		if resp.TotalPlaytimeMinutes != 0 {
			t.Errorf("Expected 0 playtime for invalid user, got %d", resp.TotalPlaytimeMinutes)
		}
	}
}
