import "./PrescriptionPanel.css";
import { useState, useEffect } from 'react';
import { getRecommendations, type Recommendation } from "../../api";

interface GameTileProps {
  game: Recommendation;
};

// GameTile component
export const GameTile = ({ game }: GameTileProps) => {
  const imageUrl = `https://steamcdn-a.akamaihd.net/steam/apps/${game.game_id}/header.jpg`;

  return (
    <div>
      <img src={imageUrl} width="50%"/>
      <div>
        <h3>{game.name}</h3>
        <div 
          dangerouslySetInnerHTML={{ __html: game.description }}
        />
        {game.initial_price != game.current_price && (
          <p><s>${String(game.initial_price)}</s></p>
        )}
        <p>${String(game.current_price)}</p>
        <p>Release Date: {(new Date(game.release_date_unix * 1000)).toLocaleDateString()}</p>
        <p>Review Score: {game.review_percentage}% ({game.review_count})</p>
      </div>
      <button
        type="button"
        className="visit-store-page-btn"
        onClick={() => { window.open("https://store.steampowered.com/app/" + game.game_id, "_blank", "noopener,noreferrer") }}
      >
        <span>Visit store page</span>
      </button>
    </div>
  );
};

// PrescriptionPanel component
export default function PrescriptionPanel() {
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
        // Call backend API
        const settings: Record<string, any> = {}; // No settings for now
        const response = await getRecommendations(userID, settings);
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
  }, [userID]); // The effect re-runs if userID changes

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
          game={game}
        />
      ))}
    </div>
  );
};
