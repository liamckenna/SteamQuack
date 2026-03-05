package steam

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
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
		rateLimiter: time.NewTicker(3 * time.Second), // 3 seconds between requests
	}
}

// fetches all Steam apps
func (c *APIClient) FetchAppList() (*SteamAppListResponse, error) {
	<-c.rateLimiter.C // Wait for rate limit

	url := fmt.Sprintf("https://api.steampowered.com/IStoreService/GetAppList/v1/?key=%s&max_results=50000&last_appid=0", c.apiKey)

	log.Printf("Fetching app list from: %s", url)
	resp, err := c.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch app list: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API returned status %d", resp.StatusCode)
	}

	var appList SteamAppListResponse
	if err := json.NewDecoder(resp.Body).Decode(&appList); err != nil {
		return nil, fmt.Errorf("failed to decode app list: %w", err)
	}

	log.Printf("Fetched %d apps from Steam API", len(appList.Response.Apps))
	return &appList, nil
}

// fetches detailed information for a specific game
func (c *APIClient) FetchGameDetails(appID uint32) (*SteamGameDetails, error) {
	<-c.rateLimiter.C // Wait for rate limit

	url := fmt.Sprintf("https://store.steampowered.com/api/appdetails?appids=%d", appID)

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

// cleans up the rate limiter
func (c *APIClient) Close() {
	c.rateLimiter.Stop()
}
