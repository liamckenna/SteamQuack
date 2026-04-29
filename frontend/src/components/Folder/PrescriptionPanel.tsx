import "./PrescriptionPanel.css";
import { useState, useEffect, useRef } from "react";
import { getRecommendations, type Recommendation } from "../../api";
import { useDialogue } from "../../context/DialogueContext";
import FolderPager from "./FolderPager";

interface GameTileProps {
  game: Recommendation;
}

// GameTile component
export const GameTile = ({ game }: GameTileProps) => {
  const imageUrl = `https://steamcdn-a.akamaihd.net/steam/apps/${game.game_id}/header.jpg`;
  const discountPercent =
    game.initial_price != game.current_price
      ? Math.round(
          ((game.initial_price - game.current_price) / game.initial_price) *
            100,
        )
      : 0;
  
  const { startDialogue } = useDialogue();

  return (
    <button
      className="prescription-panel__card"
      type="button"
      onDoubleClick={ () => {
        window.open('https://store.steampowered.com/app/' + game.game_id, '_blank');
      }}
      onClick={() => {
        if (discountPercent > 0) {
          startDialogue("readGameDescriptionSale", {
            "GameName": game.name,
            "ReviewScore": game.review_percentage.toFixed(0),
            "ReviewCount": game.review_count,
            "GameDescription": game.description || "I don't have a description for this one!",
            "ReleaseDate": new Date(game.release_date_unix * 1000).toLocaleDateString(),
            "Price": game.current_price > 0 ? `$${game.current_price.toFixed(2)}` : "Free",
            "Discount": discountPercent,
          });
        } else {
          startDialogue("readGameDescription", {
            "GameName": game.name,
            "ReviewScore": game.review_percentage.toFixed(0),
            "ReviewCount": game.review_count,
            "GameDescription": game.description || "I don't have a description for this one!",
            "ReleaseDate": new Date(game.release_date_unix * 1000).toLocaleDateString(),
            "Price": game.current_price > 0 ? `$${game.current_price.toFixed(2)}` : "Free",
          });
        }
      }}
    >
      <div className="prescription-panel__card-cover">
        {discountPercent != 0 && (
          <div className="prescription-panel__card-badge">
            {"-" + String(discountPercent) + "%"}
          </div>
        )}
        <img src={imageUrl} />
      </div>
      <p className="prescription-panel__card-title">{game.name}</p>
    </button>
  );
};

export type PrescriptionPanelProps = {
  preferences: {
    priceRange: [number, number];
    reviewRange: [number, number];
    releaseYearRange: [number, number];
    reviewCountRange: [number, number];
    prioritizeSale: boolean;
    prioritizeRecentPlaytime: boolean;
    prioritizedTags: string[];
    excludedTags: string[];
    prioritizedGames: number[];
    excludedGames: number[];
    randomizationFactor: number;
  };
  onLoadingChange: (isLoading: boolean) => void;
};

// PrescriptionPanel component
export default function PrescriptionPanel({
  preferences,
  onLoadingChange,
}: PrescriptionPanelProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const queryParams = new URLSearchParams(window.location.search);
  const userID = queryParams.get("steamid");
  const { startDialogue } = useDialogue();
  const hasInitialized = useRef(false);

  if (!userID) return <div className="prescription-panel">Please sign in first.</div>;

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    startDialogue("openPrescription");

  }, [startDialogue]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setIsLoading(true);
      setError(null);
      onLoadingChange(true);

      try {
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
          prioritize_recently_played_games:
          preferences.prioritizeRecentPlaytime,
          prioritized_tags: preferences.prioritizedTags,
          excluded_tags: preferences.excludedTags,
          prioritized_games: preferences.prioritizedGames,
          excluded_games: preferences.excludedGames,
          randomization_factor: preferences.randomizationFactor,
        };

        const response = await getRecommendations(userID, backendSettings);
        setRecommendations(response.recommendations || []);
        if (response.recommendations.length === 0) {
          startDialogue("noResults");
        } else {
          startDialogue("generalPrescription");
        }        
      } catch (err) {
        console.error("Error fetching recommendations:", err);
        setError("Failed to load game recommendations.");
      } finally {
        setIsLoading(false);
        onLoadingChange(false);
      }
    };

    if (userID) {
      fetchRecommendations();
    }
  }, [userID, preferences]);

  if (isLoading) return <div className="prescription-panel">Loading your recommendations...</div>;
  if (error) return <div className="prescription-panel">{error}</div>;
  if (recommendations.length === 0) return <div className="prescription-panel">No recommendations found.</div>;

  const pages = [];
  const recs = [...recommendations];

  while (recs.length > 0) {
    const pageRecs = recs.splice(0, 9);
    pages.push(
      <div className="prescription-panel__grid">
        {pageRecs.map((game) => (
          <GameTile key={game.game_id} game={game} />
        ))}
      </div>
    );
  }

  return (
    <div className="prescription-panel">
      <FolderPager pages={pages} />
    </div>
  );
}