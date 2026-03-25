package algorithm

import (
	"fmt"
	"sort"
	"steamquack/backend/database"
	"steamquack/backend/models"
	"steamquack/backend/steam"
	"steamquack/backend/tags"
)

type GameScore struct {
	GameID uint32
	Score  float64
}

func CreateRecommendations(steamService *steam.ScrapingService, tasteProfile map[string]float64, settings map[string]any) []GameScore {

	db := database.GetDB()

	var allGames []models.Game

	gameScores := make(map[uint32]float64)

	result := db.Preload("Tags").Find(&allGames)

	if result.Error != nil {
		fmt.Println("Uh oh, database error:", result.Error)
		return nil
	}

	for _, game := range allGames {
		score := 0.0

		for _, tag := range game.Tags {
			score += tasteProfile[tag.TagName] * tag.Weight
		}

		//other factors here

		gameScores[game.AppID] = score
	}

	sortedScores := make([]GameScore, 0, len(gameScores))

	for id, score := range gameScores {
		sortedScores = append(sortedScores, GameScore{
			GameID: id,
			Score:  score,
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

func CreateTasteProfile(steamService *steam.ScrapingService, profileURL string) map[string]float64 {

	// called automatically from successful api call after ensuring user has a public profile

	gamePlaytimeMap := GetUserAppsAndPlaytime(steamService, profileURL)

	userTagWeights := tags.GetInitialTagWeights()

	for gameID, playtime := range gamePlaytimeMap {
		gameTagWeights := tags.GetBaseTagWeights(gameID)
		if playtime > 0 {
			for tag, weight := range gameTagWeights {
				userTagWeights[tag] += weight * float64(playtime)
			}
		}
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
	// for each game in profile:
	// get playtime for each game, store in map[appID]playtime

	gameCount := userOwnedGames.Response.GameCount
	gamez := userOwnedGames.Response.Games

	for i := 0; i < gameCount; i++ {
		game := gamez[i]
		gamePlaytimes[game.AppID] = uint32(game.PlaytimeForever)
	}

	//print map for testing
	for appID, playtime := range gamePlaytimes {
		fmt.Printf("App ID: %d, Playtime: %d minutes\n", appID, playtime)
	}

	return gamePlaytimes
}
