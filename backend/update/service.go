package update

import (
	"log"
	"steamquack/backend/steam"

	"gorm.io/gorm"
)

type UpdateService struct {
	scrapingService *steam.ScrapingService
	db              *gorm.DB
}

// creates a new database update service
func NewUpdateService(scrapingService *steam.ScrapingService, db *gorm.DB) *UpdateService {
	return &UpdateService{
		scrapingService: scrapingService,
		db:              db,
	}
}

// updates existing games and fetches detailed data for new games
func (u *UpdateService) UpdateDatabase() error {
	log.Println("Starting database update process...")

	// Phase 1: Fetch batch data (Updates existing games, inserts base data for new games)
	log.Println("Phase 1: Fetching and upserting batch data from SteamSpy...")
	if err := u.scrapingService.ScrapeBatchGameData(); err != nil {
		log.Printf("Error during batch scrape: %v\n", err)
		return err
	}

	// Phase 2: Fetch Steam details and tags ONLY for games created today
	log.Println("Phase 2: Fetching detailed descriptions and tags for newly added games...")
	if err := u.scrapingService.UpdateNewGameDetails(); err != nil {
		log.Printf("Error updating details for new games: %v\n", err)
		return err
	}

	log.Println("Database update completed successfully.")
	return nil
}
