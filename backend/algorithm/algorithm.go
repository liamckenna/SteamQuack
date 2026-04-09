package algorithm

import (
	"cmp"
	"fmt"
	"math/rand"
	"slices"
	"sort"
	"steamquack/backend/database"
	"steamquack/backend/models"
	"steamquack/backend/steam"
	"steamquack/backend/tags"
	"time"

	"gorm.io/gorm"
)

type GameScore struct {
	GameID uint32
	Score  float64
	Name   string
}

func CreateRecommendations(steamService *steam.ScrapingService, tasteProfile map[string]float64, excludedGames []uint32, settings steam.Settings) []GameScore {

	db := database.GetDB()
	gameScores := make(map[uint32]GameScore)

	startYear := time.Date(settings.ReleaseYearFloor, 1, 1, 0, 0, 0, 0, time.UTC)
	endYear := time.Date(settings.ReleaseYearCeiling, 12, 31, 23, 59, 59, 999999999, time.UTC)

	query := db.Model(&models.Game{}).
		Where("current_price >= ? AND current_price <= ?", settings.PriceFloor, settings.PriceCeiling).
		Where("review_count >= ? AND review_count <= ?", settings.ReviewCountFloor, settings.ReviewCountCeiling).
		Where("review_percentage >= ? AND review_percentage <= ?", settings.ReviewPercentageFloor, settings.ReviewPercentageCeiling).
		Where("release_date >= ? AND release_date <= ?", startYear, endYear)

	if len(excludedGames) > 0 {
		query = query.Where("app_id NOT IN ?", excludedGames)
	}

	var batchGames []models.Game

	result := query.Preload("Tags").FindInBatches(&batchGames, 1000, func(tx *gorm.DB, batch int) error {
		for _, game := range batchGames {
			score := 0.0
			multiplier := 1.0
			isExcluded := false

			for _, tag := range game.Tags {
				if tag.Weight > 0 {
					if exists := slices.Contains(settings.ExcludedTags, tag.TagName); exists {
						isExcluded = true
						break
					}
					if exists := slices.Contains(settings.PrioritizedTags, tag.TagName); exists {
						score += tasteProfile[tag.TagName] * float64(tag.Weight) * 2
					} else {
						score += tasteProfile[tag.TagName] * float64(tag.Weight)
					}
				}
			}

			if isExcluded || score == 0.0 {
				continue
			}

			multiplier += float64(game.ReviewPercentage) / 100.0

			if settings.PrioritizeGamesOnSale && game.CurrentPrice < game.InitialPrice {
				multiplier += float64(game.InitialPrice-game.CurrentPrice) / float64(game.InitialPrice)
			}

			score *= multiplier

			if score > 0 {
				gameScores[game.AppID] = GameScore{
					GameID: game.AppID,
					Score:  score,
					Name:   game.Name,
				}
			}
		}
		return nil
	})

	if result.Error != nil {
		fmt.Println("Uh oh, database error:", result.Error)
		return nil
	}

	sortedScores := make([]GameScore, 0, len(gameScores))
	for _, gs := range gameScores {
		sortedScores = append(sortedScores, gs)
	}

	sort.Slice(sortedScores, func(i, j int) bool {
		return sortedScores[i].Score > sortedScores[j].Score
	})

	topN := 9
	if len(sortedScores) < topN {
		topN = len(sortedScores)
	}

	return sortedScores[:topN]
}

func CreateTasteProfile(steamService *steam.ScrapingService, profileURL string, settings steam.Settings) map[string]float64 {

	gamePlaytimeMap := GetUserAppsAndPlaytime(steamService, profileURL)
	userTagWeights := make(map[string]float64)

	tagCategoryWeights := tags.GetTagCategoryWeights()
	tagCategories := tags.GetAllPossibleTags()

	excludedGamesSet := make(map[uint32]struct{}, len(settings.ExcludedGames))
	for _, id := range settings.ExcludedGames {
		excludedGamesSet[id] = struct{}{}
	}

	prioritizedGamesSet := make(map[uint32]struct{}, len(settings.PrioritizedGames))
	for _, id := range settings.PrioritizedGames {
		prioritizedGamesSet[id] = struct{}{}
	}

	for gameID, playtime := range gamePlaytimeMap {
		if playtime <= 0 {
			continue
		}

		if _, exists := excludedGamesSet[gameID]; exists {
			continue
		}

		prioritizedWeight := 1.0
		if _, exists := prioritizedGamesSet[gameID]; exists {
			prioritizedWeight = 2.0
		}

		baseGameMultiplier := (float64(playtime) / 100.0) * prioritizedWeight

		gameTagWeights := tags.GetBaseTagWeights(gameID)

		for tag, weight := range gameTagWeights {
			if weight > 0 && weight <= 1 { //filters out broken tags
				category := tagCategories[tag]
				categoryWeight := tagCategoryWeights[category]

				randomizedContribution := 1.0 + settings.RandomizationFactor*(rand.Float64()*2.0-1.0)

				userTagWeights[tag] += weight * baseGameMultiplier * categoryWeight * randomizedContribution
			}
		}
	}

	keys := make([]string, 0, len(userTagWeights))
	for k := range userTagWeights {
		keys = append(keys, k)
	}

	slices.SortFunc(keys, func(a, b string) int {
		return cmp.Compare(userTagWeights[b], userTagWeights[a])
	})

	fmt.Println("--- User Taste Profile ---")
	for _, k := range keys {
		fmt.Printf("%s: %.2f\n", k, userTagWeights[k])
	}

	return userTagWeights
}

func GetUserAppsAndPlaytime(steamService *steam.ScrapingService, profileURL string) map[uint32]uint32 {

	gamePlaytimes := make(map[uint32]uint32)

	// api call to get app ids and playtime for all games in the user's profile
	userOwnedGames, err := steamService.GetUserOwnedGames(profileURL)
	if err != nil {
		fmt.Println("Error fetching user owned games:", err)
		return gamePlaytimes
	}

	gameCount := userOwnedGames.Response.GameCount
	gamez := userOwnedGames.Response.Games

	for i := 0; i < gameCount; i++ {
		game := gamez[i]
		gamePlaytimes[game.AppID] = uint32(game.PlaytimeForever)
	}

	return gamePlaytimes
}
