package steam

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"
)

type APIClient struct {
	httpClient  *http.Client
	apiKey      string
	rateLimiter *time.Ticker
}

// creates a new Steam API client with rate limiting
func NewAPIClient(apiKey string) *APIClient {
	return &APIClient{
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
		apiKey:      apiKey,
		rateLimiter: time.NewTicker(1500 * time.Millisecond), // 1.5 seconds between requests
	}
}

// fetches all Steam apps
func (c *APIClient) FetchAppList(lastAppId int) (*SteamAppListResponse, int, error) {
	<-c.rateLimiter.C // Wait for rate limit

	url := fmt.Sprintf("https://api.steampowered.com/IStoreService/GetAppList/v1/?key=%s&max_results=50000&last_appid=%d", c.apiKey, lastAppId)

	log.Printf("Fetching app list from: %s", url)
	resp, err := c.httpClient.Get(url)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to fetch app list: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, 0, fmt.Errorf("API returned status %d", resp.StatusCode)
	}

	var appList SteamAppListResponse
	if err := json.NewDecoder(resp.Body).Decode(&appList); err != nil {
		return nil, 0, fmt.Errorf("failed to decode app list: %w", err)
	}

	log.Printf("Fetched %d apps from Steam API", len(appList.Response.Apps))
	return &appList, int(appList.Response.Apps[len(appList.Response.Apps)-1].AppID), nil
}

// fetches detailed information for a specific game
func (c *APIClient) FetchGameDetails(appID uint32) (*SteamGameDetails, error) {
	<-c.rateLimiter.C // Wait for rate limit

	url := fmt.Sprintf("https://store.steampowered.com/api/appdetails?appids=%d&l=english", appID)

	resp, err := c.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch game details for %d: %w", appID, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API returned status %d for app %d", resp.StatusCode, appID)
	}

	var detailsResponse SteamGameDetailsResponse
	if err := json.NewDecoder(resp.Body).Decode(&detailsResponse); err != nil {
		return nil, fmt.Errorf("failed to decode game details for %d: %w", appID, err)
	}

	// Steam API returns map with appID as key
	appIDStr := fmt.Sprintf("%d", appID)
	if gameWrapper, exists := detailsResponse[appIDStr]; exists && gameWrapper.Success {
		return &gameWrapper.Data, nil
	}

	return nil, fmt.Errorf("game %d not found or failed to fetch", appID)
}

// fetches tag data from SteamSpy
func (c *APIClient) FetchSteamSpyData(appID uint32) (*SteamSpyAppDetails, error) {
	<-c.rateLimiter.C // Wait for rate limit

	url := fmt.Sprintf("https://steamspy.com/api.php?request=appdetails&appid=%d", appID)

	resp, err := c.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch data for %d: %w", appID, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("SteamSpy API returned status %d for app %d", resp.StatusCode, appID)
	}

	var spyData SteamSpyAppDetails
	if err := json.NewDecoder(resp.Body).Decode(&spyData); err != nil {
		return nil, fmt.Errorf("failed to decode data for %d: %w", appID, err)
	}

	return &spyData, nil
}

// fetches a dictionary of 1000 games from a specific SteamSpy page
func (c *APIClient) FetchSteamSpyPage(page int) (SteamSpyPageResponse, error) {
	<-c.rateLimiter.C // Respect base client rate limit

	url := fmt.Sprintf("https://steamspy.com/api.php?request=all&page=%d", page)
	log.Printf("Fetching SteamSpy page %d: %s", page, url)

	resp, err := c.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch SteamSpy page %d: %w", page, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("SteamSpy API returned status %d for page %d", resp.StatusCode, page)
	}

	contentType := resp.Header.Get("Content-Type")
	if !strings.Contains(contentType, "application/json") {
		return nil, fmt.Errorf("SteamSpy API returned non-JSON response for page %d", page)
	}

	var pageData SteamSpyPageResponse
	if err := json.NewDecoder(resp.Body).Decode(&pageData); err != nil {
		return nil, fmt.Errorf("failed to decode SteamSpy page %d: %w", page, err)
	}

	return pageData, nil
}

// fetches player summary
func (c *APIClient) FetchPlayerSummary(steamID string) (*SteamPlayerSummary, error) {
	url := fmt.Sprintf("http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=%s&steamids=%s",
		c.apiKey, steamID)

	resp, err := c.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch player summary: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Steam API returned status %d", resp.StatusCode)
	}

	var summaryResp SteamPlayerSummaryResponse
	if err := json.NewDecoder(resp.Body).Decode(&summaryResp); err != nil {
		return nil, fmt.Errorf("failed to decode player summary response: %w", err)
	}

	if len(summaryResp.Response.Players) == 0 {
		return nil, fmt.Errorf("no player data found for Steam ID: %s", steamID)
	}

	return &summaryResp.Response.Players[0], nil
}

// fetches games owned by a given player
func (c *APIClient) FetchOwnedGames(steamID string) (*SteamOwnedGamesResponse, error) {
	url := fmt.Sprintf("http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=%s&steamid=%s&format=json&include_appinfo=true&include_played_free_games=1",
		c.apiKey, steamID)

	resp, err := c.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch owned games: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Steam API returned status %d", resp.StatusCode)
	}

	var gamesResp SteamOwnedGamesResponse
	if err := json.NewDecoder(resp.Body).Decode(&gamesResp); err != nil {
		return nil, fmt.Errorf("failed to decode owned games response: %w", err)
	}

	return &gamesResp, nil
}

// cleans up the rate limiter
func (c *APIClient) Close() {
	c.rateLimiter.Stop()
}
