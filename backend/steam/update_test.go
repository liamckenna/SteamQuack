package steam

import (
	"testing"
	"time"

	"steamquack/backend/config"
	"steamquack/backend/models"
)

func TestProcessIndividualGame(t *testing.T) {
	db := SetupTestDB()
	cfg := config.LoadConfig()
	service := NewScrapingService(cfg, db)

	// 1. Test Insert (New Game)
	spyGame := &SteamSpyPageGame{
		AppID:        100,
		Name:         "Test Game",
		Positive:     80,
		Negative:     20,
		InitialPrice: "1000",
	}

	err := service.processIndividualGame(spyGame)
	if err != nil {
		t.Fatalf("expected no error on insert, got: %v", err)
	}

	var savedGame models.Game
	if err := db.Where("app_id = ?", 100).First(&savedGame).Error; err != nil {
		t.Fatalf("failed to find inserted game: %v", err)
	}

	if savedGame.Name != "Test Game" {
		t.Errorf("got name %q, want %q", savedGame.Name, "Test Game")
	}
	if savedGame.ReviewCount != 100 {
		t.Errorf("got review count %d, want %d", savedGame.ReviewCount, 100)
	}
	if savedGame.ReviewPercentage != 80.0 {
		t.Errorf("got review percentage %f, want %f", savedGame.ReviewPercentage, 80.0)
	}
	if savedGame.InitialPrice != 10.0 {
		t.Errorf("got initial price %f, want %f", savedGame.InitialPrice, 10.0)
	}

	// 2. Test Update (Existing Game)
	db.Model(&savedGame).Update("description", "Existing description")

	spyGameUpdated := &SteamSpyPageGame{
		AppID:        100,
		Name:         "Test Game (Renamed)",
		Positive:     90,
		Negative:     20,
		InitialPrice: "500",
	}

	err = service.processIndividualGame(spyGameUpdated)
	if err != nil {
		t.Fatalf("expected no error on update, got: %v", err)
	}

	var updatedGame models.Game
	if err := db.Where("app_id = ?", 100).First(&updatedGame).Error; err != nil {
		t.Fatalf("failed to find updated game: %v", err)
	}

	if updatedGame.Name != "Test Game (Renamed)" {
		t.Errorf("got name %q, want %q", updatedGame.Name, "Test Game (Renamed)")
	}
	if updatedGame.ReviewCount != 110 {
		t.Errorf("got review count %d, want %d", updatedGame.ReviewCount, 110)
	}
	if updatedGame.InitialPrice != 5.0 {
		t.Errorf("got initial price %f, want %f", updatedGame.InitialPrice, 5.0)
	}
	if updatedGame.Description != "Existing description" {
		t.Errorf("got description %q, want %q", updatedGame.Description, "Existing description")
	}
}

func TestUpdateNewGameDetails(t *testing.T) {
	db := SetupTestDB()
	cfg := config.LoadConfig()
	service := NewScrapingService(cfg, db)

	// Seed the database with one "old" game and one "new" game
	yesterday := time.Now().Add(-24 * time.Hour)
	db.Create(&models.Game{AppID: 200, Name: "Old Game", CreatedAt: yesterday})
	db.Create(&models.Game{AppID: 300, Name: "Day of Defeat: Source", CreatedAt: time.Now()})

	err := service.UpdateNewGameDetails()
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}

	// Verify old game was ignored
	var checkOld models.Game
	db.Where("app_id = ?", 200).First(&checkOld)
	if checkOld.Description != "" {
		t.Errorf("expected old game description to be empty, got %q", checkOld.Description)
	}

	// Verify new game was updated
	var checkNew models.Game
	db.Where("app_id = ?", 300).First(&checkNew)
	if checkNew.Description != "Valve's WWII Multiplayer Classic - Now available for Mac." {
		t.Errorf("expected new game description 'Valve's WWII Multiplayer Classic - Now available for Mac.', got %q", checkNew.Description)
	}
}
