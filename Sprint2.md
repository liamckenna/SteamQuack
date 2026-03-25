# Sprint 2 Recap

## The issues we successfully addressed:
- **Access User Information:** Access Steam's public API to fetch a user's profile information and owned games by game time from the backend.
- **Create tag weight system:** Implement a default tag weighting system per game based on the number of times a tag is voted by users


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