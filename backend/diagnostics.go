package main

import (
	"encoding/json"
	"net/http"
	"sort"
	"steamquack/backend/database"
	"steamquack/backend/models"
	"steamquack/backend/steam"
	"steamquack/backend/tags"

	"github.com/gorilla/mux"
)

type DiagnosticsResponse struct {
	TotalPlaytimeMinutes       int                     `json:"total_playtime_minutes"`
	MostPlayedGame             *steam.SteamOwnedGame   `json:"most_played_game"`
	NichestGame                *models.Game            `json:"nichest_game"` // based on lowest review count among owned games that exist in our db
	RecentlyPlayed             []*steam.SteamOwnedGame `json:"recently_played"`
	PreferredGameType          string                  `json:"preferred_game_type"` // e.g. "Action RPG, Auto Battler, Sandbox with 2D Fighter, 3D Fighter, 4X"
	SuperGenresBreakdown       map[string]float64      `json:"super_genres_breakdown"`
	GenresBreakdown            map[string]float64      `json:"genres_breakdown"`
	SubGenresBreakdown         map[string]float64      `json:"sub_genres_breakdown"`
	VisualsViewpointsBreakdown map[string]float64      `json:"visuals_viewpoints_breakdown"`
	ThemesMoodsBreakdown       map[string]float64      `json:"themes_moods_breakdown"`
	FeaturesBreakdown          map[string]float64      `json:"features_breakdown"`
	PlayersBreakdown           map[string]float64      `json:"players_breakdown"`
	AssessmentsBreakdown       map[string]float64      `json:"assessments_breakdown"`
}

func DiagnosticsHandler(steamService *steam.ScrapingService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		steamID := vars["steamid"]

		if steamID == "" {
			http.Error(w, "Steam ID is required", http.StatusBadRequest)
			return
		}

		ownedGamesResp, err := steamService.GetUserOwnedGames(steamID)
		if err != nil {
			http.Error(w, "Failed to fetch owned games", http.StatusInternalServerError)
			return
		}

		if len(ownedGamesResp.Response.Games) == 0 {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(DiagnosticsResponse{
				RecentlyPlayed:             make([]*steam.SteamOwnedGame, 0),
				SuperGenresBreakdown:       make(map[string]float64),
				GenresBreakdown:            make(map[string]float64),
				SubGenresBreakdown:         make(map[string]float64),
				VisualsViewpointsBreakdown: make(map[string]float64),
				ThemesMoodsBreakdown:       make(map[string]float64),
				FeaturesBreakdown:          make(map[string]float64),
				PlayersBreakdown:           make(map[string]float64),
				AssessmentsBreakdown:       make(map[string]float64),
			})
			return
		}

		totalPlaytime := 0
		var mostPlayed *steam.SteamOwnedGame
		var nichestPtr *models.Game
		var recentlyPlayed []*steam.SteamOwnedGame

		// gets user's total playtime
		ownedAppIDs := make([]uint32, 0, len(ownedGamesResp.Response.Games))
		for i := range ownedGamesResp.Response.Games {
			game := &ownedGamesResp.Response.Games[i]
			totalPlaytime += game.PlaytimeForever

			if mostPlayed == nil || game.PlaytimeForever > mostPlayed.PlaytimeForever {
				mostPlayed = game
			}
			ownedAppIDs = append(ownedAppIDs, game.AppID)
		}

		db := database.GetDB()

		// find the nichest game (lowest review count) from user's owned games
		var nichestGame models.Game
		result := db.Where("app_id IN ?", ownedAppIDs).Order("review_count ASC").First(&nichestGame)
		if result.Error == nil {
			nichestPtr = &nichestGame
		}

		// gets user's recently played games
		for i := range ownedGamesResp.Response.Games {
			game := &ownedGamesResp.Response.Games[i]
			if game.Playtime2Weeks > 0 {
				recentlyPlayed = append(recentlyPlayed, game)
			}
		}

		categoryCounts := map[string]map[string]int{
			"super-genre":         make(map[string]int),
			"genre":               make(map[string]int),
			"sub-genre":           make(map[string]int),
			"visuals & viewpoint": make(map[string]int),
			"themes & moods":      make(map[string]int),
			"features":            make(map[string]int),
			"players":             make(map[string]int),
			"assessments":         make(map[string]int),
		}

		allPossibleTags := tags.GetAllPossibleTags()

		type GameTagResult struct {
			GameID  uint32
			TagName string
		}

		var userGameTags []GameTagResult
		db.Table("game_tags").
			Select("games.app_id as game_id, game_tags.tag_name").
			Joins("JOIN games ON games.id = game_tags.game_id").
			Where("games.app_id IN ?", ownedAppIDs).
			Scan(&userGameTags)

		gameCategories := make(map[uint32]map[string]map[string]bool)

		for _, gt := range userGameTags {
			category := allPossibleTags[gt.TagName]

			if _, exists := categoryCounts[category]; exists {
				if gameCategories[gt.GameID] == nil {
					gameCategories[gt.GameID] = make(map[string]map[string]bool)
				}
				if gameCategories[gt.GameID][category] == nil {
					gameCategories[gt.GameID][category] = make(map[string]bool)
				}
				gameCategories[gt.GameID][category][gt.TagName] = true
			}
		}

		for _, categoriesMap := range gameCategories {
			for category, tagsMap := range categoriesMap {
				for tagName := range tagsMap {
					categoryCounts[category][tagName]++
				}
			}
		}

		dbGamesCount := int64(0)
		db.Model(&models.Game{}).Where("app_id IN ?", ownedAppIDs).Count(&dbGamesCount)

		breakdowns := map[string]map[string]float64{
			"super-genre":         make(map[string]float64),
			"genre":               make(map[string]float64),
			"sub-genre":           make(map[string]float64),
			"visuals & viewpoint": make(map[string]float64),
			"themes & moods":      make(map[string]float64),
			"features":            make(map[string]float64),
			"players":             make(map[string]float64),
			"assessments":         make(map[string]float64),
		}

		if dbGamesCount > 0 {
			for cat, counts := range categoryCounts {
				for tagName, count := range counts {
					breakdowns[cat][tagName] = (float64(count) / float64(dbGamesCount)) * 100
				}
			}
		}

		type TagCount struct {
			TagName string
			Count   int
		}

		var sortedGenres []TagCount
		for g, count := range categoryCounts["genre"] {
			sortedGenres = append(sortedGenres, TagCount{g, count})
		}
		sort.Slice(sortedGenres, func(i, j int) bool {
			return sortedGenres[i].Count > sortedGenres[j].Count
		})

		var sortedSubGenres []TagCount
		for sg, count := range categoryCounts["sub-genre"] {
			sortedSubGenres = append(sortedSubGenres, TagCount{sg, count})
		}
		sort.Slice(sortedSubGenres, func(i, j int) bool {
			return sortedSubGenres[i].Count > sortedSubGenres[j].Count
		})

		var topGenres []string
		for i := 0; i < len(sortedGenres) && i < 3; i++ {
			topGenres = append(topGenres, sortedGenres[i].TagName)
		}

		var topSubGenres []string
		for i := 0; i < len(sortedSubGenres) && i < 3; i++ {
			topSubGenres = append(topSubGenres, sortedSubGenres[i].TagName)
		}

		preferredGameType := ""
		for _, g := range topGenres {
			preferredGameType = preferredGameType + " " + g
		}

		preferredGameType += " with "

		for _, sg := range topSubGenres {
			preferredGameType = preferredGameType + " " + sg
		}
		preferredGameType = preferredGameType + " gameplay"

		response := DiagnosticsResponse{
			TotalPlaytimeMinutes:       totalPlaytime,
			MostPlayedGame:             mostPlayed,
			NichestGame:                nichestPtr,
			RecentlyPlayed:             recentlyPlayed,
			PreferredGameType:          preferredGameType,
			SuperGenresBreakdown:       breakdowns["super-genre"],
			GenresBreakdown:            breakdowns["genre"],
			SubGenresBreakdown:         breakdowns["sub-genre"],
			VisualsViewpointsBreakdown: breakdowns["visuals & viewpoint"],
			ThemesMoodsBreakdown:       breakdowns["themes & moods"],
			FeaturesBreakdown:          breakdowns["features"],
			PlayersBreakdown:           breakdowns["players"],
			AssessmentsBreakdown:       breakdowns["assessments"],
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}
}
