package algorithm

import (
	"cmp"
	"fmt"
	"slices"
	"sort"
	"steamquack/backend/database"
	"steamquack/backend/models"
	"steamquack/backend/steam"
	"steamquack/backend/tags"
	"strings"
)

type GameScore struct {
	GameID uint32
	Score  float64
	Name   string
}

func CreateRecommendations(steamService *steam.ScrapingService, tasteProfile map[string]float64, excludedGames []uint32, settings steam.Settings) []GameScore {

	db := database.GetDB()

	var allGames []models.Game

	gameScores := make(map[uint32]GameScore, len(allGames))

	result := db.Preload("Tags").Find(&allGames)

	if result.Error != nil {
		fmt.Println("Uh oh, database error:", result.Error)
		return nil
	}

	for _, game := range allGames {
		score := 0.0

		if exists := slices.Contains(excludedGames, game.AppID); exists { //excluded games
			continue
		}
		if (game.CurrentPrice < settings.PriceFloor) || (game.CurrentPrice > settings.PriceCeiling) { //price range
			continue
		}
		if (game.ReviewCount < settings.ReviewCountFloor) || (game.ReviewCount > settings.ReviewCountCeiling) { //review count range
			continue
		}
		if (game.ReviewPercentage < settings.ReviewPercentageFloor) || (game.ReviewPercentage > settings.ReviewPercentageCeiling) { //review percentage range
			continue
		}
		if (game.ReleaseDate.Year() < settings.ReleaseYearFloor) || (game.ReleaseDate.Year() > settings.ReleaseYearCeiling) { //release year range
			continue
		}

		for _, tag := range game.Tags {
			if tag.Weight > 0 {
				if exists := slices.Contains(settings.ExcludedTags, tag.TagName); exists { //excluded tags
					score = 0.0
					break
				}
				if exists := slices.Contains(settings.PrioritizedTags, tag.TagName); exists { //prioritized tags (scale contribution by 2)
					score += tasteProfile[tag.TagName] * tag.Weight * 2
				} else {
					score += tasteProfile[tag.TagName] * tag.Weight
				}
			}
		}

		score *= 1 + (float64(game.ReviewPercentage) / 100) //scale by review percentage

		if settings.PrioritizeGamesOnSale && game.CurrentPrice < game.InitialPrice { //prioritize games on sale (scale by discount amount)
			score *= 1 + (float64(game.InitialPrice-game.CurrentPrice) / float64(game.InitialPrice))
		}

		if score > 0 {
			gameScores[game.AppID] = GameScore{
				GameID: game.AppID,
				Score:  score,
				Name:   game.Name,
			}
		}
	}

	sortedScores := make([]GameScore, 0, len(gameScores))

	for id := range gameScores {
		sortedScores = append(sortedScores, GameScore{
			GameID: id,
			Score:  gameScores[id].Score,
			Name:   gameScores[id].Name,
		})
	}

	sort.Slice(sortedScores, func(i, j int) bool {
		return sortedScores[i].Score > sortedScores[j].Score
	})

	topN := 5
	if len(sortedScores) < topN {
		topN = len(sortedScores)
	}

	topGames := make([]GameScore, 0, topN)
	for i := 0; i < topN; i++ {
		gameScore := sortedScores[i]
		topGames = append(topGames, gameScore)
	}
	return topGames
}

func CreateTasteProfile(steamService *steam.ScrapingService, profileURL string, settings steam.Settings) map[string]float64 {

	// called automatically from successful api call after ensuring user has a public profile

	gamePlaytimeMap := GetUserAppsAndPlaytime(steamService, profileURL)

	userTagWeights := make(map[string]float64)

	tagCategoryWeights := tags.GetTagCategoryWeights()

	tagCategories := tags.GetAllPossibleTags()

	prioritizedWeight := 1.0
	for gameID, playtime := range gamePlaytimeMap {
		gameTagWeights := tags.GetBaseTagWeights(gameID)
		if playtime > 0 {
			if exists := slices.Contains(settings.ExcludedGames, gameID); exists {
				continue
			}
			prioritizedWeight = 1.0
			if exists := slices.Contains(settings.PrioritizedGames, gameID); exists { //prioritized games (scale contribution by 2)
				prioritizedWeight = 2.0
			}
			for tag, weight := range gameTagWeights {
				if weight > 0 && weight <= 1 { //this "&& weight <= 1" filters out the broken tags
					tagLower := strings.ToLower(tag)
					category := tagCategories[tagLower]
					categoryWeight := tagCategoryWeights[category]
					tagContribution := weight * float64(playtime)
					userTagWeights[tag] += tagContribution / 100 * prioritizedWeight * categoryWeight
				}
			}
		}
	}

	//print user taste profile for debugging
	keys := make([]string, 0, len(userTagWeights))
	for k := range userTagWeights {
		keys = append(keys, k)
	}

	slices.SortFunc(keys, func(a, b string) int {
		return cmp.Compare(userTagWeights[a], userTagWeights[b])
	})

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
