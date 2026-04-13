# Sprint 2 Recap

## The issues we successfully addressed:
- **Access User Information:** Access Steam's public API to fetch a user's profile information and owned games by game time from the backend
- **Create tag weight system:** Implement a default tag weighting system per game based on the number of times a tag is voted by users
- **Create user taste profile:** Use API user information and game tag data to create a curated user taste profile for recommendations
- **First version of recommendation algorithm:** Implemented the basis of the recommendation algorithm using a user taste profile and tag data from every game in the DB
- **Created frontend folder system:** Created folder system to house main app content, including tabs for each program "page" (still a single page application)
- **Successfully partially fill database for testing:** Inserted ~800 games into the database to use for algorithm testing
- **Created automatic database filler and updater:** Made a scheduled updater that will automatically update existing game data and insert newly released games into the database every week

## Backend API documentation:

### Localhost URL
http://localhost:8080/

### Health Check
**Endpoint:** `GET /api/health`
**Description:** Checks if the API server is running and healthy.

---

### User Profile & Owned Games
**Endpoint:** `GET /api/user/profile/{steamid}`
**Description:** Fetches a user's Steam profile information and their owned games by playtime.
**Parameters:**
- `steamid`: The Steam ID of the user (example: `76561198012345678`)

---

### Profile Parse (Frontend Integration)
**Endpoint:** `POST /api/profile/parse`
**Description:** Parses a user's Steam profile URL or ID and returns their profile information and games by playtime.

---

### Get Recommendations
**Endpoint:** `POST /api/recommendations`
**Description:** Generates game recommendations for a user based on their taste profile and settings.

---

### Scrape Multiple Games
**Endpoint:** `POST /api/scrape/games/{count}`
**Description:** Starts a job to scrape game data from Steam API for a given amount of games and saves them to the database.
**Parameters:**
- `count`: Number of games to scrape (1-100)

---

### Scrape Specific Game
**Endpoint:** `POST /api/scrape/game/{appid}`
**Description:** Scrapes data for a specific game from Steam and saves it to the database.
**Parameters:**
- `appid`: Steam App ID for a given game

---

### Get Scraping Statistics
**Endpoint:** `GET /api/stats`
**Description:** Retrieves statistics about scraping progress such as the latest game scrapped and when it was added to the database and the total amount of games added to the database.

---

## Backend Test Cases:

**TestFetchPlayerSummary:** Tests FetchPlayerSummary scrapper function by verifying if the API call completes and the returned Steam ID matches the requested Steam ID.

**TestFetchOwnedGames:** Tests FetchOwnedGames scrapper function by verifying if the API call completes and checks if the map of games returned matches a given user's list of games owned.

**TestScrapeGameDataWithSpecificAppID:** Tests scrapping a game by a specific id by scrapping a given game to a test database and verifying if the App ID of the entry is correct and that the game was saved to the database. Also checks if scrapping the game if it already exists in the databse should fail.

**TestScrapeGameDataMultipleGames:** Tests function for scraping multiple games by scraping 3 games from Steam and verifies if the exact number of games were scraped to the database.

## Front End Test Cases:

**ProfileParse-NotFound:** Enters an invalid SteamID in to the profile parser and verifies that no profile was found.

**ProfileParse-Private:** Enters the SteamID of a private Steam profile and verifies that its privacy status is recognized.

**ProfileParse-Public:** Enters a valid, public steam profile ID and returns the expected resulting summary of that user's play data.

**Recommendations-Flow:** Produces expected recommendations for a given valid profile. No testing was performed for invalid or private profiles as other safeguards are planned to not allow this function to be accessed without first verifying the validity and public status of the profile.
