package main

import (
	"log"
	"steamquack/backend/database"
	"steamquack/backend/models"
	"time"
)

func main() {
	// Initialize the database
	database.InitDatabase()
	defer database.CloseDatabase()

	// Placeholder: Create a sample game with tags and review
	createSampleData()

	// Placeholder: Query games
	queryGames()
}

func createSampleData() {
	db := database.GetDB()

	// Create a sample game
	releaseDate := time.Date(2013, 8, 13, 0, 0, 0, 0, time.UTC) // EU4 release date
	game := models.Game{
		AppID:            236850, // Europa Universalis IV
		Name:             "Europa Universalis IV",
		Description:      "Europa Universalis IV is a grand strategy wargame developed by Paradox Development Studio. Rule your nation through the centuries, with unparalleled freedom, depth and historical accuracy. True exploration, trade, warfare and diplomacy.",
		InitialPrice:     39.99,
		CurrentPrice:     9.99, // On sale
		ReleaseDate:      releaseDate,
		ReleaseDateUnix:  releaseDate.Unix(),
		ReviewCount:      78000,
		ReviewPercentage: 91.2,
		Tags: []models.GameTag{
			{TagName: "Strategy", Weight: 1.0},
			{TagName: "Grand Strategy", Weight: 1.0},
			{TagName: "Historical", Weight: 0.9},
			{TagName: "Multiplayer", Weight: 0.8},
			{TagName: "Singleplayer", Weight: 0.8},
			{TagName: "Simulation", Weight: 0.7},
		},
		Reviews: []models.UserReview{
			{
				SteamUserID:      "76561198000000001",
				AuthorID:         123,
				ReviewText:       "Good game tough learning curve.",
				IsPositive:       true,
				HelpfulCount:     150,
				PlaytimeAtReview: 72000,
				ReviewDate:       time.Now().AddDate(0, -2, 0),
			},
		},
	}

	// Creates the game with all associated data
	result := db.Create(&game)
	if result.Error != nil {
		log.Printf("Error creating sample game: %v", result.Error)
		return
	}

	log.Printf("Successfully created game: %s (ID: %d)", game.Name, game.ID)
}

func queryGames() {
	db := database.GetDB()

	// Query all games with their tags and reviews
	var games []models.Game
	result := db.Preload("Tags").Preload("Reviews").Find(&games)

	if result.Error != nil {
		log.Printf("Error querying games: %v", result.Error)
		return
	}

	log.Printf("Found %d games:", len(games))
	for _, game := range games {
		log.Printf("- %s (App ID: %d, Price: $%.2f -> $%.2f, Reviews: %.1f%% positive)",
			game.Name, game.AppID, game.InitialPrice, game.CurrentPrice, game.ReviewPercentage)
		log.Printf("  Description: %s", truncateString(game.Description, 100))

		log.Printf("  Tags: ")
		for _, tag := range game.Tags {
			log.Printf("    - %s (weight: %.1f)", tag.TagName, tag.Weight)
		}

		log.Printf("  Reviews: %d", len(game.Reviews))
		for _, review := range game.Reviews {
			sentiment := "positive"
			if !review.IsPositive {
				sentiment = "negative"
			}
			log.Printf("    - %s review by Author %d (playtime: %d mins, helpful: %d): %s...",
				sentiment,
				review.AuthorID,
				review.PlaytimeAtReview,
				review.HelpfulCount,
				truncateString(review.ReviewText, 50))
		}
	}
}

func truncateString(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}
