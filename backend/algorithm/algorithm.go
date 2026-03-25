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
	Name   string
}

func CreateRecommendations(steamService *steam.ScrapingService, tasteProfile map[string]float64, excludedApps []uint32, settings map[string]any) []GameScore {

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
		excluded := false
		for app := range excludedApps {
			if excludedApps[app] == game.AppID {
				gameScores[game.AppID] = GameScore{
					GameID: game.AppID,
					Score:  score,
					Name:   game.Name,
				}
				excluded = true
				break
			}
		}
		if excluded {
			continue
		}

		for _, tag := range game.Tags {
			if tag.Weight > 0 {
				score += tasteProfile[tag.TagName] * tag.Weight
			}
		}

		//other factors here

		gameScores[game.AppID] = GameScore{
			GameID: game.AppID,
			Score:  score,
			Name:   game.Name,
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

func CreateTasteProfile(steamService *steam.ScrapingService, profileURL string) map[string]float64 {

	// called automatically from successful api call after ensuring user has a public profile

	gamePlaytimeMap := GetUserAppsAndPlaytime(steamService, profileURL)

	userTagWeights := tags.GetInitialTagWeights()

	for gameID, playtime := range gamePlaytimeMap {
		gameTagWeights := tags.GetBaseTagWeights(gameID)
		if playtime > 0 {
			for tag, weight := range gameTagWeights {
				if weight > 0 {
					tagContribution := weight * float64(playtime)
					userTagWeights[tag] += tagContribution
				}
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
