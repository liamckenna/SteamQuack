package steam

import (
	"fmt"
	"log"
	"steamquack/backend/config"
	"steamquack/backend/models"
	"steamquack/backend/tags"
	"time"

	"gorm.io/gorm"
)

type ScrapingService struct {
	client *APIClient
	db     *gorm.DB
	config *config.Config
}

// creates a new Steam scraping service
func NewScrapingService(cfg *config.Config, db *gorm.DB) *ScrapingService {
	client := NewAPIClient(cfg.SteamAPIKey)
	return &ScrapingService{
		client: client,
		db:     db,
		config: cfg,
	}
}

// scrapes game data from Steam
func (s *ScrapingService) ScrapeGameData(maxGames int) error {
	log.Printf("Starting Steam game data scraping (max %d games)", maxGames)

	// gets list of all apps
	appList, err := s.client.FetchAppList()
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

		// adds delay due to rate limits
		time.Sleep(2 * time.Second)
	}

	log.Printf("Scraping complete! Processed: %d", processed)
	return nil
}

// scrapes data for a single game and saves to database
func (s *ScrapingService) scrapeIndividualGame(appID uint32) error {
	gameDetails, err := s.client.FetchGameDetails(appID)
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
	steamspyData, err := s.client.FetchSteamSpyData(appID)
	if err != nil {
		log.Printf("Warning: SteamSpy unavailable for app %d, using Steam tags: %v", appID, err)
		steamspyData = nil // will cause fallback to be used in transform function
	}

	// convert and save tags
	gameTags := SteamTagsToGameTags(gameDetails, game.ID, steamspyData)
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

	// normalize tag weights after transaction is committed
	if len(gameTags) > 0 {
		tags.CreateBaseTagWeights(uint32(game.ID))
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
	return s.client.FetchPlayerSummary(steamID)
}

// fetches a user's owned games by playtime
func (s *ScrapingService) GetUserOwnedGames(steamID string) (*SteamOwnedGamesResponse, error) {
	return s.client.FetchOwnedGames(steamID)
}

// clean up
func (s *ScrapingService) Close() {
	s.client.Close()
}
