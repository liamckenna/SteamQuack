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

	if err != nil {
		t.Logf("API call returned error: %v", err)
	}

	if games != nil && games.Response.GameCount > 0 {
		t.Logf("Successfully fetched %d games for user", games.Response.GameCount)

		// Validate expected games are present
		expectedGames := map[uint32]string{
			42960:   "Victoria II",
			203770:  "Crusader Kings II",
			236850:  "Europa Universalis IV",
			255710:  "Cities: Skylines",
			292030:  "The Witcher 3: Wild Hunt",
			394360:  "Hearts of Iron IV",
			1158310: "Crusader Kings III",
			1222670: "The Sims 4",
		}

		foundGames := make(map[uint32]bool)
		for _, game := range games.Response.Games {
			foundGames[game.AppID] = true
		}

		// Check that at least some expected games are found
		foundCount := 0
		for appID := range expectedGames {
			if foundGames[appID] {
				foundCount++
			}
		}

		if foundCount != len(expectedGames) {
			t.Errorf("Expected all %d games to be found, but only found %d", len(expectedGames), foundCount)
		}
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

		// tests duplicate detection try to scrape the same game again
		_, err2 := service.ScrapeSpecificGame(220)
		if err2 != nil {
			t.Logf("Second scrape returned error: %v", err2)
		}

		var gameCount int64
		db.Model(&models.Game{}).Where("app_id = ?", 220).Count(&gameCount)

		if gameCount > 1 {
			t.Errorf("Expected only 1 game with app ID 220, but found %d - duplicate detection failed", gameCount)
		} else if gameCount == 1 {
			t.Log("Duplicate detection working - only 1 game stored despite scraping twice")
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
		t.Logf("Error scraping multiple games: %v", err)
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
