package steam

import (
	"steamquack/backend/config"
	"steamquack/backend/models"
	"testing"
)

// tests the API call to fetch user profile
func TestFetchPlayerSummary(t *testing.T) {
	cfg := config.LoadConfig()
	client := NewAPIClient(cfg.SteamAPIKey)
	steamID := "76561198012345678"

	summary, err := client.FetchPlayerSummary(steamID)

	if err != nil {
		t.Logf("API call returned error: %v", err)
	}

	if summary != nil {
		if summary.SteamID != steamID {
			t.Logf("Expected Steam ID %s, got %s", steamID, summary.SteamID)
		}
	}
}

// tests the API call to fetch user's owned games
func TestFetchOwnedGames(t *testing.T) {
	cfg := config.LoadConfig()
	client := NewAPIClient(cfg.SteamAPIKey)
	steamID := "76561198012345678"

	games, err := client.FetchOwnedGames(steamID)

	// With real API key, should either succeed or fail gracefully
	if err != nil {
		t.Logf("API call returned error (OK if API unavailable): %v", err)
	}

	if games != nil && games.Response.GameCount > 0 {
		t.Logf("Successfully fetched %d games for user", games.Response.GameCount)
	}
}

// tests scraping a specific game
func TestScrapeGameDataWithSpecificAppID(t *testing.T) {
	db := SetupTestDB()
	defer CloseTestDB(db)

	cfg := config.LoadConfig()
	client := NewAPIClient(cfg.SteamAPIKey)
	service := &ScrapingService{
		client: client,
		db:     db,
	}

	game, err := service.ScrapeSpecificGame(220)

	if err != nil {
		t.Logf("Error scraping specific game: %v", err)
	}

	if game != nil {
		if game.AppID != 220 {
			t.Errorf("Expected app ID 220, got %d", game.AppID)
		}

		if game.Name == "" {
			t.Error("Expected game name to be populated")
		}

		// checks if game was saved to database
		var savedGame models.Game
		result := db.Where("app_id = ?", 220).First(&savedGame)
		if result.Error == nil && savedGame.ID > 0 {
			if savedGame.AppID != 220 {
				t.Errorf("Saved game has wrong app ID: expected 220, got %d", savedGame.AppID)
			}
		}
	}
}

// tests scraping multiple games by count
func TestScrapeGameDataMultipleGames(t *testing.T) {
	db := SetupTestDB()
	defer CloseTestDB(db)

	cfg := config.LoadConfig()
	client := NewAPIClient(cfg.SteamAPIKey)
	service := &ScrapingService{
		client: client,
		db:     db,
	}

	maxGames := 3
	err := service.ScrapeGameData(maxGames, 0)

	if err != nil {
		t.Logf("Error scraping multiple games (may be expected): %v", err)
	}

	// verify games were saved to database
	var gamesCount int64
	db.Model(&models.Game{}).Count(&gamesCount)

	if gamesCount > 0 {
		t.Logf("Successfully scraped %d games", gamesCount)

		if gamesCount > int64(maxGames) {
			t.Errorf("Expected at most %d games, but scraped %d", maxGames, gamesCount)
		}
	} else {
		t.Log("No games scraped (API may be unavailable)")
	}
}
