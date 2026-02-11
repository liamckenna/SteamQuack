# SteamQuack Database Setup

## Database Schema

### Games Table
- app_id: Steam application ID
- name: Name of the game
- description: Game description
- initial_price: Original price of the game
- current_price: Current price (sale price if on sale)
- release_date: Release date as timestamp
- release_date_unix: Release date as Unix timestamp
- review_count: Total number of reviews
- review_percentage: Percentage of positive reviews

### Game Tags Table
- game_id: Foreign key to games table
- tag_name: Name of the tag (ex: "Shooter", "Indie")
- weight: Weight for recommendation algorithm

### User Reviews Table
- game_id: Foreign key to games table
- steam_user_id: Steam user ID who wrote the review
- author_id: Author ID as integer
- review_text: Full text of the review
- is_positive: Boolean indicating if review is positive
- helpful_count: Number of users who found review helpful
- playtime_at_review: Playtime in minutes when review was written
- review_date: When the review was written

## Getting Started

1. Install dependencies:
   ```bash
   go mod tidy
   ```

2. Run the database example (temporary testing):
   ```bash
   go run example.go
   ```

3. This will create a SQLite database file `steamquack.db` with the schema and sample data.
