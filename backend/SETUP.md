# SteamQuack Setup Instructions

## Environment Variables Setup

Edit .env file with these values:
   ```bash
   STEAM_API_KEY=STEAM_API_KEY
   DATABASE_PATH=steamquack.db
   SERVER_PORT=8080
   ```

## Running the Application

1. Install dependencies:
   ```bash
   go mod tidy
   ```
2. Set environment variables
3. Run the server:
   ```bash
   go run backend/main.go
   ```

## Getting Your Steam API Key

1. Go to https://steamcommunity.com/dev/apikey
2. Enter your domain
3. Copy the generated key
4. Paste it in your .env file
