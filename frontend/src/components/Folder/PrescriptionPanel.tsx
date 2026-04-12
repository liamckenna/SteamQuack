import "./PrescriptionPanel.css";
import { useState, useEffect } from 'react';
import { getRecommendations, type Recommendation } from "../../api";

interface GameTileProps {
  game_id: number;
  score: number;
  name: string;
  description: string;
};

// GameTile component
export const GameTile = ({ game_id, score, name, description }: GameTileProps) => {
  const imageUrl = `https://steamcdn-a.akamaihd.net/steam/apps/${game_id}/header.jpg`;

  return (
    <div>
      <img src={imageUrl} width="50%"/>
      <div>
        <h3>{name}</h3>
        <p>{description}</p>
      </div>
      <button
        type="button"
        className="visit-store-page-btn"
        onClick={() => { window.open("https://store.steampowered.com/app/" + game_id, "_blank", "noopener,noreferrer") }}
      >
        <span>Visit store page</span>
      </button>
    </div>
  );
};

export type PrescriptionPanelProps = {
  preferences: {
    priceRange: [number, number];
    reviewRange: [number, number];
    releaseYearRange: [number, number];
    reviewCountRange: [number, number];
    prioritizeSale: boolean;
    prioritizedTags: string[];
    excludedTags: string[];
    prioritizedGames: number[];
    excludedGames: number[];
    randomizationFactor: number;
  };
};

// PrescriptionPanel component
export default function PrescriptionPanel({ preferences }: PrescriptionPanelProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const queryParams = new URLSearchParams(window.location.search);
  const userID = queryParams.get('steamid');

  if (!userID) return <div>Please sign in first.</div>;

  useEffect(() => {
    // Define the async fetch function
    const fetchRecommendations = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // maps slider/search values back into backend json
        const backendSettings = {
           price_floor: preferences.priceRange[0],
           price_ceiling: preferences.priceRange[1],
           review_percentage_floor: preferences.reviewRange[0],
           review_percentage_ceiling: preferences.reviewRange[1],
           release_year_floor: preferences.releaseYearRange[0],
           release_year_ceiling: preferences.releaseYearRange[1],
           review_count_floor: preferences.reviewCountRange[0],
           review_count_ceiling: preferences.reviewCountRange[1],
           prioritize_games_on_sale: preferences.prioritizeSale,
           prioritized_tags: preferences.prioritizedTags,
           excluded_tags: preferences.excludedTags,
           prioritized_games: preferences.prioritizedGames,
           excluded_games: preferences.excludedGames,
           randomization_factor: preferences.randomizationFactor,
        };

        const response = await getRecommendations(userID, backendSettings);
        setRecommendations(response.recommendations || []);
      } catch (err) {
        console.error("Error fetching recommendations:", err);
        setError("Failed to load game recommendations.");
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if a userID is provided
    if (userID) {
      fetchRecommendations();
    }
  }, [userID, preferences]); // The effect re-runs if userID changes or if preferences change

  // Handle loading and error states
  if (isLoading) return <div>Loading your recommendations...</div>;
  if (error) return <div>{error}</div>;
  if (recommendations.length === 0) return <div>No recommendations found.</div>;

  // Render the grid
  return (
    <div className="prescription-panel">
      {recommendations.map((game) => (
        <GameTile
          key={game.game_id}
          game_id={game.game_id}
          score={100}
          name={game.name}
          description={"[Placeholder description]"}
        />
      ))}
    </div>
  );
};
