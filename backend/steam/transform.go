package steam

import (
	"strconv"
	"time"

	"steamquack/backend/models"
	"steamquack/backend/tags"
)

// converts Steam API game details to database model
func SteamToGameModel(steamGame *SteamGameDetails, appID uint32) *models.Game {
	game := &models.Game{
		AppID:       appID,
		Name:        steamGame.Name,
		Description: steamGame.ShortDescription,
	}

	// handles release date
	if steamGame.ReleaseDate.Date != "" {
		if parsedDate, err := time.Parse("Jan 2, 2006", steamGame.ReleaseDate.Date); err == nil {
			game.ReleaseDate = parsedDate
			game.ReleaseDateUnix = parsedDate.Unix()
		} else if parsedDate, err := time.Parse("2006", steamGame.ReleaseDate.Date); err == nil {
			game.ReleaseDate = parsedDate
			game.ReleaseDateUnix = parsedDate.Unix()
		}
	}

	// handles price (convert cents to dollars)
	if steamGame.PriceOverview != nil {
		if steamGame.PriceOverview.Initial > 0 {
			game.InitialPrice = float64(steamGame.PriceOverview.Initial) / 100.0
		}
		if steamGame.PriceOverview.Final > 0 {
			game.CurrentPrice = float64(steamGame.PriceOverview.Final) / 100.0
		} else {
			game.CurrentPrice = game.InitialPrice // When no sale is going on
		}
	}

	return game
}

// converts tags to our GameTag models
func SteamTagsToGameTags(steamGame *SteamGameDetails, gameID uint, steamspyData *SteamSpyAppDetails) []models.GameTag {
	var tags []models.GameTag

	if steamspyData != nil && len(steamspyData.Tags) > 0 {
		for tagName, votes := range steamspyData.Tags {
			tags = append(tags, models.GameTag{
				GameID:  gameID,
				TagName: tagName,
				Weight:  float64(votes),
			})
		}
		return tags
	}

	// fallback to Steam's basic categories/genres if SteamSpy unavailable
	tagNames := make(map[string]bool) // To avoid duplicates

	// add categories as tags
	for _, category := range steamGame.Categories {
		if category.Description != "" && !tagNames[category.Description] {
			tags = append(tags, models.GameTag{
				GameID:  gameID,
				TagName: category.Description,
				Weight:  1.0, // default maybe set up calculations later
			})
			tagNames[category.Description] = true
		}
	}

	// add genres as tags
	for _, genre := range steamGame.Genres {
		if genre.Description != "" && !tagNames[genre.Description] {
			tags = append(tags, models.GameTag{
				GameID:  gameID,
				TagName: genre.Description,
				Weight:  1.0,
			})
			tagNames[genre.Description] = true
		}
	}

	return tags
}

// converts SteamSpy page game to the database model
func SteamSpyPageToGameModel(spyGame *SteamSpyPageGame) *models.Game {
	game := &models.Game{
		AppID: spyGame.AppID,
		Name:  spyGame.Name,
	}

	// Calculate reviews
	totalReviews := spyGame.Positive + spyGame.Negative
	game.ReviewCount = totalReviews
	if totalReviews > 0 {
		game.ReviewPercentage = (float64(spyGame.Positive) / float64(totalReviews)) * 100.0
	}

	// Parse prices (convert from string cents to float dollars)
	if initialPrice, err := strconv.ParseFloat(spyGame.InitialPrice, 64); err == nil {
		game.InitialPrice = initialPrice / 100.0
	}
	if currentPrice, err := strconv.ParseFloat(spyGame.Price, 64); err == nil {
		game.CurrentPrice = currentPrice / 100.0
	}

	return game
}

// updates an existing game model with detailed Steam API data (description, release date)
func UpdateGameWithSteamDetails(game *models.Game, gameDetails *SteamGameDetails) {
	game.Description = gameDetails.ShortDescription

	if gameDetails.ReleaseDate.Date != "" {
		if parsedDate, err := time.Parse("Jan 2, 2006", gameDetails.ReleaseDate.Date); err == nil {
			game.ReleaseDate = parsedDate
			game.ReleaseDateUnix = parsedDate.Unix()
		} else if parsedDate, err := time.Parse("2 Jan, 2006", gameDetails.ReleaseDate.Date); err == nil {
			game.ReleaseDate = parsedDate
			game.ReleaseDateUnix = parsedDate.Unix()
		} else if parsedDate, err := time.Parse("2006", gameDetails.ReleaseDate.Date); err == nil {
			game.ReleaseDate = parsedDate
			game.ReleaseDateUnix = parsedDate.Unix()
		}
	}
}

// updates an existing game model with SteamSpy API tag data
func UpdateGameWithTagData(game *models.Game, gameDetails *SteamGameDetails, steamspyData *SteamSpyAppDetails) {
	var gameTags []models.GameTag
	allPossibleTags := tags.GetAllPossibleTags()

	// add SteamSpy tags if present, otherwise fallback to Steam genres
	if steamspyData != nil && len(steamspyData.Tags) > 0 {
		for tagName, votes := range steamspyData.Tags {
			if _, exists := allPossibleTags[tagName]; exists {
				gameTags = append(gameTags, models.GameTag{
					GameID:  game.ID,
					TagName: tagName,
					Weight:  float64(votes),
				})
			}
		}
	} else if gameDetails != nil && len(gameDetails.Genres) > 0 {
		for _, genre := range gameDetails.Genres {
			if _, exists := allPossibleTags[genre.Description]; exists {
				gameTags = append(gameTags, models.GameTag{
					GameID:  game.ID,
					TagName: genre.Description,
					Weight:  1.0,
				})
			}
		}
	}

	// normalize and set tags
	game.Tags = tags.NormalizeTagWeights(gameTags)
}

// converts string app ID to uint32
func ParseAppIDFromString(appIDStr string) (uint32, error) {
	parsed, err := strconv.ParseUint(appIDStr, 10, 32)
	if err != nil {
		return 0, err
	}
	return uint32(parsed), nil
}
