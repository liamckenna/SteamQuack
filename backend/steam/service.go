package steam

import (
	"fmt"
	"log"
	"steamquack/backend/config"
	"steamquack/backend/models"
	"steamquack/backend/tags"
	"sync"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type ScrapingService struct {
	db     *gorm.DB
	config *config.Config
}

// creates a new Steam scraping service
func NewScrapingService(cfg *config.Config, db *gorm.DB) *ScrapingService {
	return &ScrapingService{
		db:     db,
		config: cfg,
	}
}

// scrapes batch game data from SteamSpy paginated endpoint
func (s *ScrapingService) ScrapeBatchGameData() error {
	client := NewAPIClient(s.config.SteamAPIKey, 60000)
	defer client.Close()

	log.Println("Starting batch game data scraping from SteamSpy...")
	page := 0

	for {
		pageData, err := client.FetchSteamSpyPage(page)
		if err != nil {
			log.Printf("Stopping batch scrape: error fetching page %d: %v", page, err)
			break
		}

		// Stop if the page has no games
		if len(pageData) == 0 {
			log.Printf("No games found on page %d. Batch scraping complete.", page)
			break
		}

		processed := 0
		for _, spyGame := range pageData {
			if spyGame.Name == "" {
				continue
			}

			// Pass a copy of the struct to avoid pointer issues in the loop
			gameCopy := spyGame
			if err := s.processIndividualGame(&gameCopy); err != nil {
				log.Printf("Error scraping game %d (%s): %v", spyGame.AppID, spyGame.Name, err)
			}

			processed++
		}

		log.Printf("Processed %d new games from page %d", processed, page)
		page++

		log.Println("Waiting 60 seconds before fetching the next page to respect rate limits...")
	}

	return nil
}

// handles saving an individual game fetched from the batch process
func (s *ScrapingService) processIndividualGame(spyGame *SteamSpyPageGame) error {
	// Convert to model
	game := SteamSpyPageToGameModel(spyGame)

	// Upsert the game using AppID as the unique conflict key
	err := s.db.Clauses(clause.OnConflict{
		Columns: []clause.Column{{Name: "app_id"}},
		DoUpdates: clause.AssignmentColumns([]string{
			"name",
			"initial_price",
			"current_price",
			"review_count",
			"review_percentage",
			"updated_at",
		}),
	}).Create(game).Error

	if err != nil {
		return fmt.Errorf("failed to upsert game %d: %w", spyGame.AppID, err)
	}

	return nil
}

// fetches descriptions, release dates, and tags for new games
func (s *ScrapingService) UpdateNewGameDetails() error {
	steamClient := NewAPIClient(s.config.SteamAPIKey, 1500)
	steamspyClient := NewAPIClient(s.config.SteamAPIKey, 1000)
	defer steamClient.Close()
	defer steamspyClient.Close()

	// Determine the start of the current day to filter new entries
	now := time.Now()
	startOfDay := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

	var newGames []models.Game
	if err := s.db.Where("created_at >= ?", startOfDay).Find(&newGames).Error; err != nil {
		return fmt.Errorf("failed to fetch new games: %w", err)
	}

	log.Printf("Found %d new games added today. Fetching detailed data...", len(newGames))

	for i, game := range newGames {
		log.Printf("Fetching details for new game %d/%d: %s", i+1, len(newGames), game.Name)

		var gameDetails *SteamGameDetails
		var steamspyData *SteamSpyAppDetails
		var gameDetailsErr error
		var steamspyDataErr error
		var wg sync.WaitGroup
		wg.Add(2)
		go func() {
			defer wg.Done()
			gameDetails, gameDetailsErr = steamClient.FetchGameDetails(game.AppID)
		}()
		go func() {
			defer wg.Done()
			steamspyData, steamspyDataErr = steamspyClient.FetchSteamSpyData(game.AppID)
		}()
		wg.Wait()

		// 1. Update with Steam details for description & release date
		if gameDetailsErr != nil {
			log.Printf("Warning: Failed to fetch Steam details for %d: %v", game.AppID, gameDetailsErr)
		} else if gameDetails != nil {
			UpdateGameWithSteamDetails(&game, gameDetails)
		}

		// 2. Update with SteamSpy tags
		if steamspyDataErr != nil {
			log.Printf("Warning: SteamSpy tags unavailable for app %d: %v", game.AppID, steamspyDataErr)
		} else if steamspyData != nil {
			UpdateGameWithTagData(&game, gameDetails, steamspyData)
		}

		s.db.Save(&game) // Update the record in the database
	}

	return nil
}

// scrapes game data from Steam
func (s *ScrapingService) ScrapeGameData(maxGames int, nextLastAppId int) error {
	client := NewAPIClient(s.config.SteamAPIKey, 1500)
	defer client.Close()

	log.Printf("Starting Steam game data scraping (max %d games)", maxGames)

	// gets list of all apps
	appList, returnedLastAppId, err := client.FetchAppList(nextLastAppId)
	if err != nil {
		return fmt.Errorf("failed to fetch app list: %w", err)
	}

	log.Printf("Found %d total apps, processing %d games", len(appList.Response.Apps), maxGames)

	// processes games one by one
	processed := 0

	for _, app := range appList.Response.Apps {
		if processed >= maxGames {
			break
		}

		// skip apps with empty names
		if app.Name == "" {
			continue
		}

		// check if database already has this game
		var existingGame models.Game
		result := s.db.Where("app_id = ?", app.AppID).First(&existingGame)
		if result.Error == nil {
			log.Printf("Game %d (%s) already in database, skipping", app.AppID, app.Name)
			continue
		}

		// scrape detailed game data
		if err := s.scrapeIndividualGame(app.AppID); err != nil {
			log.Printf("Error scraping game %d (%s): %v", app.AppID, app.Name, err)
			continue
		}

		processed++
		log.Printf("Successfully processed game %d/%d: %s", processed, maxGames, app.Name)
	}

	log.Printf("Scraping complete! Processed: %d (next batch starts at app %d)", processed, returnedLastAppId)
	return nil
}

// scrapes data for a single game and saves to database
func (s *ScrapingService) scrapeIndividualGame(appID uint32) error {
	client := NewAPIClient(s.config.SteamAPIKey, 1500)
	defer client.Close()

	gameDetails, err := client.FetchGameDetails(appID)
	if err != nil {
		return fmt.Errorf("failed to fetch game details: %w", err)
	}

	// filter out apps that are not games
	if gameDetails.Type != "game" {
		return fmt.Errorf("app %d is not a game (type: %s)", appID, gameDetails.Type)
	}

	// start database transaction
	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// convert Steam data to our models
	game := SteamToGameModel(gameDetails, appID)

	// save game to database
	if err := tx.Create(game).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to save game: %w", err)
	}

	// fetch community voted tags from SteamSpy using game ID
	steamspyData, err := client.FetchSteamSpyData(appID)
	if err != nil {
		log.Printf("Warning: SteamSpy unavailable for app %d, using Steam tags: %v", appID, err)
		steamspyData = nil // will cause fallback to be used in transform function
	}

	// convert, normalize, and save tags
	gameTags := SteamTagsToGameTags(gameDetails, game.ID, steamspyData)
	gameTags = tags.NormalizeTagWeights(gameTags)
	if len(gameTags) > 0 {
		if err := tx.CreateInBatches(gameTags, 10).Error; err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to save tags: %w", err)
		}
	}

	// commit transaction
	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// scrapes data for a single specific game by App ID
func (s *ScrapingService) ScrapeSpecificGame(appID uint32) (*models.Game, error) {
	log.Printf("Scraping specific game with App ID: %d", appID)

	if err := s.scrapeIndividualGame(appID); err != nil {
		return nil, err
	}

	// return the saved game with relationships
	var game models.Game
	if err := s.db.Preload("Tags").Where("app_id = ?", appID).First(&game).Error; err != nil {
		return nil, fmt.Errorf("failed to retrieve saved game: %w", err)
	}

	return &game, nil
}

// returns statistics about scraped data
func (s *ScrapingService) GetScrapingStats() (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// count total games
	var gameCount int64
	if err := s.db.Model(&models.Game{}).Count(&gameCount).Error; err != nil {
		return nil, err
	}

	// count total tags
	var tagCount int64
	if err := s.db.Model(&models.GameTag{}).Count(&tagCount).Error; err != nil {
		return nil, err
	}

	// gets most recent game added
	var latestGame models.Game
	s.db.Order("created_at DESC").First(&latestGame)

	stats["total_games"] = gameCount
	stats["total_tags"] = tagCount
	stats["latest_game"] = latestGame.Name
	stats["latest_game_added"] = latestGame.CreatedAt

	return stats, nil
}

// fetches a user's profile information
func (s *ScrapingService) GetUserProfile(steamID string) (*SteamPlayerSummary, error) {
	client := NewAPIClient(s.config.SteamAPIKey, 0)
	defer client.Close()

	return client.FetchPlayerSummary(steamID)
}

// fetches a user's owned games by playtime
func (s *ScrapingService) GetUserOwnedGames(steamID string) (*SteamOwnedGamesResponse, error) {
	client := NewAPIClient(s.config.SteamAPIKey, 0)
	defer client.Close()

	return client.FetchOwnedGames(steamID)
}

// fetches a user's Steam ID using their vanity URL name
func (s *ScrapingService) GetUserSteamID(profile string) (*SteamResolveVanityURLResponse, error) {
	client := NewAPIClient(s.config.SteamAPIKey, 0)
	defer client.Close()

	return client.FetchSteamID(profile)
}
