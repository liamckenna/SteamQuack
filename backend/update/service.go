package update

import (
	"log"
	"steamquack/backend/models"
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

// updates games and tag data
func (u *UpdateService) UpdateDatabase() error {
	log.Println("Starting database update process...")

	log.Println("Clearing existing games...")
	if err := u.db.Session(&gorm.Session{AllowGlobalUpdate: true}).Delete(&models.Game{}).Error; err != nil {
		return err
	}

	log.Println("Initiating Steam scrape...")
	err := u.scrapingService.ScrapeBatchGameData()
	if err != nil {
		log.Printf("Error during database update: %v\n", err)
		return err
	}

	// TODO: add description, release date, and tag data for new games

	log.Println("Database update completed successfully.")
	return nil
}
