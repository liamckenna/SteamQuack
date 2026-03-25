package steam

// App List API struct
type SteamAppListResponse struct {
	Response struct {
		Apps         []SteamApp `json:"apps"`
		HaveMoreData bool       `json:"have_more_data"`
		LastAppID    uint32     `json:"last_appid"`
	} `json:"response"`
}

type SteamApp struct {
	AppID             uint32 `json:"appid"`
	Name              string `json:"name"`
	LastModified      int64  `json:"last_modified"`
	PriceChangeNumber int64  `json:"price_change_number"`
}

// Game Details API structs
type SteamGameDetailsResponse map[string]SteamGameDetailsWrapper

type SteamGameDetailsWrapper struct {
	Success bool             `json:"success"`
	Data    SteamGameDetails `json:"data"`
}

type SteamGameDetails struct {
	Type                string           `json:"type"` // filter for game vs dlc
	Name                string           `json:"name"`
	DetailedDescription string           `json:"detailed_description"`
	PriceOverview       *SteamPriceInfo  `json:"price_overview"` // For InitialPrice/CurrentPrice
	ReleaseDate         SteamReleaseDate `json:"release_date"`   // For ReleaseDate
	Categories          []SteamCategory  `json:"categories"`     // For GameTag table
	Genres              []SteamGenre     `json:"genres"`         // For GameTag table
}

type SteamPriceInfo struct {
	Initial int `json:"initial"` // Price in cents → InitialPrice
	Final   int `json:"final"`   // Sale price in cents → CurrentPrice
}

type SteamReleaseDate struct {
	ComingSoon bool   `json:"coming_soon"`
	Date       string `json:"date"`
}

type SteamCategory struct {
	ID          int    `json:"id"`
	Description string `json:"description"`
}

type SteamGenre struct {
	ID          string `json:"id"`
	Description string `json:"description"`
}

type SteamSpyAppDetails struct {
	AppID           uint32         `json:"appid"`
	Name            string         `json:"name"`
	Tags            map[string]int `json:"tags"` // tag_name -> vote_count
	Owners          string         `json:"owners"`
	Players2W       int            `json:"players_2weeks"`
	AveragePlaytime int            `json:"average_playtime"` // in minutes
	MedianPlaytime  int            `json:"median_playtime"`  // in minutes
}

type SteamPlayerSummaryResponse struct {
	Response struct {
		Players []SteamPlayerSummary `json:"players"`
	} `json:"response"`
}

type SteamPlayerSummary struct {
	SteamID      string `json:"steamid"`
	PersonaName  string `json:"personaname"`
	ProfileURL   string `json:"profileurl"`
	Avatar       string `json:"avatar"`
	AvatarMedium string `json:"avatarmedium"`
	AvatarFull   string `json:"avatarfull"`
	Visibility   int    `json:"communityvisibilitystate"`
}

type SteamOwnedGamesResponse struct {
	Response struct {
		GameCount int              `json:"game_count"`
		Games     []SteamOwnedGame `json:"games"`
	} `json:"response"`
}

type SteamOwnedGame struct {
	AppID           uint32 `json:"appid"`
	Name            string `json:"name"`
	PlaytimeForever int    `json:"playtime_forever"` // in minutes
}
