package update

import (
	"log"
	"time"

	"github.com/robfig/cron/v3"
)

type Scheduler struct {
	cron          *cron.Cron
	updateService *UpdateService
}

// initializes the cron job runner
func NewScheduler(updateService *UpdateService) *Scheduler {
	// ensure the scheduler follows EST/EDT
	location, err := time.LoadLocation("America/New_York")
	if err != nil {
		log.Fatalf("Failed to load timezone: %v", err)
	}

	c := cron.New(cron.WithLocation(location))

	return &Scheduler{
		cron:          c,
		updateService: updateService,
	}
}

// configures the schedule and begins listening
func (s *Scheduler) Start() {
	// cron expression: Minute 0, Hour 5, Any Day, Any Month, Day of Week 1 (Monday)
	_, err := s.cron.AddFunc("0 5 * * 1", func() {
		log.Println("Scheduled task triggered: Updating database")
		if err := s.updateService.UpdateDatabase(); err != nil {
			log.Printf("Scheduled update failed: %v", err)
		}
	})

	if err != nil {
		log.Fatalf("Failed to add cron job: %v", err)
	}

	log.Println("Starting scheduler... Database updates will run every Monday at 5:00 AM EST")
	s.cron.Start()
}

// halts the cron scheduler
func (s *Scheduler) Stop() {
	log.Println("Stopping the scheduler...")
	s.cron.Stop()
}
