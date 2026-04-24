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
	TotalPlaytimeMinutes int                     `json:"total_playtime_minutes"`
	MostPlayedGame       *steam.SteamOwnedGame   `json:"most_played_game"`
	NichestGame          *steam.SteamOwnedGame   `json:"nichest_game"`        // based on lowest review count among owned games that exist in our db
	PreferredGameType    string                  `json:"preferred_game_type"` // e.g. "Action RPG, Auto Battler, Sandbox with 2D Fighter, 3D Fighter, 4X"
	RecentlyPlayed       []*steam.SteamOwnedGame `json:"recently_played"`
	GenresBreakdown      map[string]float64      `json:"genres_breakdown"`
	SubGenresBreakdown   map[string]float64      `json:"sub_genres_breakdown"`
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
				GenresBreakdown:    make(map[string]float64),
				SubGenresBreakdown: make(map[string]float64),
			})
			return
		}

		totalPlaytime := 0
		var mostPlayed *steam.SteamOwnedGame
		var nichest *steam.SteamOwnedGame
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
		if result.Error != nil {
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}
		for i := range ownedGamesResp.Response.Games {
			game := &ownedGamesResp.Response.Games[i]
			if game.AppID == nichestGame.AppID {
				nichest = game
				break
			}
		}

		// gets user's recently played games
		for i := range ownedGamesResp.Response.Games {
			game := &ownedGamesResp.Response.Games[i]
			if game.Playtime2Weeks > 0 {
				recentlyPlayed = append(recentlyPlayed, game)
			}
		}

		genreCounts := make(map[string]int)
		subGenreCounts := make(map[string]int)
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

		gameGenres := make(map[uint32]map[string]bool)
		gameSubGenres := make(map[uint32]map[string]bool)

		for _, gt := range userGameTags {
			category := allPossibleTags[gt.TagName]

			if category == "genre" {
				if gameGenres[gt.GameID] == nil {
					gameGenres[gt.GameID] = make(map[string]bool)
				}
				gameGenres[gt.GameID][gt.TagName] = true
			} else if category == "sub-genre" {
				if gameSubGenres[gt.GameID] == nil {
					gameSubGenres[gt.GameID] = make(map[string]bool)
				}
				gameSubGenres[gt.GameID][gt.TagName] = true
			}
		}
		for _, gMap := range gameGenres {
			for g := range gMap {
				genreCounts[g]++
			}
		}
		for _, sgMap := range gameSubGenres {
			for sg := range sgMap {
				subGenreCounts[sg]++
			}
		}

		dbGamesCount := int64(0)
		db.Model(&models.Game{}).Where("app_id IN ?", ownedAppIDs).Count(&dbGamesCount)

		genresBreakdown := make(map[string]float64)
		subGenresBreakdown := make(map[string]float64)

		if dbGamesCount > 0 {
			for g, count := range genreCounts {
				genresBreakdown[g] = (float64(count) / float64(dbGamesCount)) * 100
			}
			for sg, count := range subGenreCounts {
				subGenresBreakdown[sg] = (float64(count) / float64(dbGamesCount)) * 100
			}
		}

		type TagCount struct {
			TagName string
			Count   int
		}

		var sortedGenres []TagCount
		for g, count := range genreCounts {
			sortedGenres = append(sortedGenres, TagCount{g, count})
		}
		sort.Slice(sortedGenres, func(i, j int) bool {
			return sortedGenres[i].Count > sortedGenres[j].Count
		})

		var sortedSubGenres []TagCount
		for sg, count := range subGenreCounts {
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
			TotalPlaytimeMinutes: totalPlaytime,
			MostPlayedGame:       mostPlayed,
			NichestGame:          nichest,
			PreferredGameType:    preferredGameType,
			RecentlyPlayed:       recentlyPlayed,
			GenresBreakdown:      genresBreakdown,
			SubGenresBreakdown:   subGenresBreakdown,
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}
}
