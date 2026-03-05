package steam

import (
	"strconv"
	"time"

	"steamquack/backend/models"
)

// converts Steam API game details to database model
func SteamToGameModel(steamGame *SteamGameDetails, appID uint32) *models.Game {
	game := &models.Game{
		AppID:       appID,
		Name:        steamGame.Name,
		Description: steamGame.DetailedDescription,
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

	// for testing the algorithm
	/*if steamspyData != nil && len(steamspyData.Tags) > 0 {
		categoryTotals := make(map[string]int)
		gameTagCounts := make(map[string]int)

		for tagName, votes := range steamspyData.Tags {
			category := getTagCategory(tagName)
			gameTagCounts[tagName] = votes
			categoryTotals[category] += votes
		}

		for tagName, votes := range gameTagCounts {
			category := getTagCategory(tagName)
			var normalizedWeight float64
			if categoryTotals[category] > 0 {
				normalizedWeight = float64(votes) / float64(categoryTotals[category])
			}

			tags = append(tags, models.GameTag{
				GameID:  gameID,
				TagName: tagName,
				Weight:  normalizedWeight,
			})
		}
		return tags
	}*/

	// actual implemenation
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

// converts string app ID to uint32
func ParseAppIDFromString(appIDStr string) (uint32, error) {
	parsed, err := strconv.ParseUint(appIDStr, 10, 32)
	if err != nil {
		return 0, err
	}
	return uint32(parsed), nil
}

// returns the Steam category for a given tag (temporary for testing)
func getTagCategory(tagName string) string {
	categories := map[string]string{
		"action":     "super-genre",
		"adventure":  "super-genre",
		"casual":     "super-genre",
		"puzzle":     "super-genre",
		"racing":     "super-genre",
		"rpg":        "super-genre",
		"simulation": "super-genre",
		"sports":     "super-genre",
		"strategy":   "super-genre",
		"tabletop":   "super-genre",

		"action rpg":            "genre",
		"action-adventure":      "genre",
		"arcade":                "genre",
		"auto battler":          "genre",
		"automobile sim":        "genre",
		"baseball":              "genre",
		"basketball":            "genre",
		"battle royale":         "genre",
		"bmx":                   "genre",
		"board game":            "genre",
		"bowling":               "genre",
		"building":              "genre",
		"card game":             "genre",
		"character action game": "genre",
		"chess":                 "genre",
		"clicker":               "genre",
		"cycling":               "genre",
		"diplomacy":             "genre",
		"esports":               "genre",
		"experimental":          "genre",
		"farming sim":           "genre",
		"fighting":              "genre",
		"football":              "genre",
		"god game":              "genre",
		"golf":                  "genre",
		"hacking":               "genre",
		"hidden object":         "genre",
		"hockey":                "genre",
		"idler":                 "genre",
		"interactive fiction":   "genre",
		"management":            "genre",
		"match 3":               "genre",
		"medical sim":           "genre",
		"mini golf":             "genre",
		"mining":                "genre",
		"mmorpg":                "genre",
		"moba":                  "genre",
		"motocross":             "genre",
		"outbreak sim":          "genre",
		"party-based rpg":       "genre",
		"pinball":               "genre",
		"platformer":            "genre",
		"point & click":         "genre",
		"rhythm":                "genre",
		"roguelike":             "genre",
		"rts":                   "genre",
		"sandbox":               "genre",
		"shooter":               "genre",
		"skateboarding":         "genre",
		"skating":               "genre",
		"skiing":                "genre",
		"snowboarding":          "genre",
		"soccer":                "genre",
		"space sim":             "genre",
		"stealth":               "genre",
		"strategy rpg":          "genre",
		"survival":              "genre",
		"tennis":                "genre",
		"trivia":                "genre",
		"turn-based strategy":   "genre",
		"visual novel":          "genre",
		"walking simulator":     "genre",
		"word game":             "genre",
		"wrestling":             "genre",

		"fps":                  "sub-genre",
		"arena shooter":        "sub-genre",
		"third-person shooter": "sub-genre",
		"horror":               "sub-genre",
		"roguelite":            "sub-genre",
		"city builder":         "sub-genre",
		"hack and slash":       "sub-genre",
		"bullet hell":          "sub-genre",
		"metroidvania":         "sub-genre",
		"souls-like":           "sub-genre",
		"survival horror":      "sub-genre",
		"tactical rpg":         "sub-genre",
		"grand strategy":       "sub-genre",
		"4x":                   "sub-genre",
		"turn-based tactics":   "sub-genre",
		"real time tactics":    "sub-genre",
		"immersive sim":        "sub-genre",
		"looter shooter":       "sub-genre",
		"hero shooter":         "sub-genre",

		"first-person":   "visuals & viewpoint",
		"third person":   "visuals & viewpoint",
		"realistic":      "visuals & viewpoint",
		"stylized":       "visuals & viewpoint",
		"pixel graphics": "visuals & viewpoint",
		"2d":             "visuals & viewpoint",
		"3d":             "visuals & viewpoint",
		"isometric":      "visuals & viewpoint",
		"top-down":       "visuals & viewpoint",
		"anime":          "visuals & viewpoint",
		"cartoon":        "visuals & viewpoint",
		"hand-drawn":     "visuals & viewpoint",

		"tactical":         "themes & moods",
		"military":         "themes & moods",
		"war":              "themes & moods",
		"sci-fi":           "themes & moods",
		"fantasy":          "themes & moods",
		"medieval":         "themes & moods",
		"futuristic":       "themes & moods",
		"atmospheric":      "themes & moods",
		"dark":             "themes & moods",
		"post-apocalyptic": "themes & moods",
		"cyberpunk":        "themes & moods",
		"steampunk":        "themes & moods",
		"space":            "themes & moods",
		"underwater":       "themes & moods",
		"western":          "themes & moods",
		"historical":       "themes & moods",
		"modern":           "themes & moods",
		"retro":            "themes & moods",

		"pvp":                     "features",
		"team-based":              "features",
		"crafting":                "features",
		"character customization": "features",
		"multiple endings":        "features",
		"choices matter":          "features",
		"level editor":            "features",
		"moddable":                "features",
		"procedural generation":   "features",
		"open world":              "features",
		"story rich":              "features",
		"nonlinear":               "features",
		"exploration":             "features",
		"base building":           "features",
		"resource management":     "features",
		"trading":                 "features",
		"physics":                 "features",
		"combat":                  "features",

		"multiplayer":           "players",
		"singleplayer":          "players",
		"co-op":                 "players",
		"online co-op":          "players",
		"local co-op":           "players",
		"local multiplayer":     "players",
		"4 player local":        "players",
		"massively multiplayer": "players",

		"competitive":      "assessments",
		"difficult":        "assessments",
		"fast-paced":       "assessments",
		"classic":          "assessments",
		"addictive":        "assessments",
		"great soundtrack": "assessments",
		"beautiful":        "assessments",
		"relaxing":         "assessments",
		"funny":            "assessments",
		"emotional":        "assessments",
		"epic":             "assessments",
		"masterpiece":      "assessments",
		"cult classic":     "assessments",
		"replay value":     "assessments",
		"short":            "assessments",
		"unforgiving":      "assessments",

		"violent":        "ratings",
		"gore":           "ratings",
		"mature":         "ratings",
		"blood":          "ratings",
		"nudity":         "ratings",
		"sexual content": "ratings",

		"software":              "software",
		"utilities":             "software",
		"design & illustration": "software",
		"animation & modeling":  "software",

		"controller":     "hardware-input",
		"mouse only":     "hardware-input",
		"touch-friendly": "hardware-input",
		"vr":             "hardware-input",

		"free to play": "funding",
		"early access": "funding",
		"crowdfunded":  "funding",

		"indie": "other-tags",
	}

	if category, exists := categories[tagName]; exists {
		return category
	}
	return "other-tags"
}
