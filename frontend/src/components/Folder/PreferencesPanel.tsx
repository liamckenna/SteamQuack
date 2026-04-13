import { useState, useRef, useEffect } from "react";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import "./PreferencesPanel.css";
import { getPreferencesOptions } from "../../api";
import type { PreferencesState } from "./Folder";

type GameOption = { id: number; name: string };

type PreferencesPanelProps = {
  preferences: PreferencesState;
  setPreferences: React.Dispatch<React.SetStateAction<PreferencesState>>;
};

export default function PreferencesPanel({ preferences, setPreferences }: PreferencesPanelProps) {
  const [allTags, setAllTags] = useState<string[]>([]);
  const [allGames, setAllGames] = useState<GameOption[]>([]);

  // load from backend on mount
  useEffect(() => {
    async function loadOptions() {
      try {
        const data = await getPreferencesOptions();
        setAllTags(data.tags || []);
        setAllGames(data.games || []);
      } catch (err) {
        console.error("Failed to load from database:", err);
      }
    }
    loadOptions();
  }, []);

  // update helper functions mapped to parent state
  const updatePref = <K extends keyof PreferencesState>(key: K, val: PreferencesState[K]) => {
    setPreferences((prev) => ({ ...prev, [key]: val }));
  };

  // search queries for the tags/games
  const [prioritizeTagSearch, setPrioritizeTagSearch] = useState("");
  const [excludeTagSearch, setExcludeTagSearch] = useState("");
  const [prioritizeGameSearch, setPrioritizeGameSearch] = useState("");
  const [excludeGameSearch, setExcludeGameSearch] = useState("");  
  // manage dropdown visibility
  const [showPrioritizeTagsDropdown, setShowPrioritizeTagsDropdown] = useState(false);
  const [showExcludeTagsDropdown, setShowExcludeTagsDropdown] = useState(false);
  const [showPrioritizeGamesDropdown, setShowPrioritizeGamesDropdown] = useState(false);
  const [showExcludeGamesDropdown, setShowExcludeGamesDropdown] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // close dropdowns if clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowPrioritizeTagsDropdown(false);
        setShowExcludeTagsDropdown(false);
        setShowPrioritizeGamesDropdown(false);
        setShowExcludeGamesDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sliderStyles = {
    track: { backgroundColor: "#64748b" },
    handle: { borderColor: "#cbd5e1", backgroundColor: "#cbd5e1" },
    rail: { backgroundColor: "rgba(255, 255, 255, 0.15)" }
  };

  const handleReset = () => {
    setPreferences({
      priceRange: [0, 100],
      reviewRange: [0, 100],
      releaseYearRange: [1970, new Date().getFullYear()],
      reviewCountRange: [0, 10000000],
      prioritizeSale: false,
      prioritizedTags: [],
      excludedTags: ["NSFW", "Nudity", "Sexual Content"],
      prioritizedGames: [],
      excludedGames: [],
      randomizationFactor: 0.0
    });
    
    setPrioritizeTagSearch("");
    setExcludeTagSearch("");
    setPrioritizeGameSearch("");
    setExcludeGameSearch("");
  };

  return (
    <div className="preferences-panel">
      <div className="preferences-panel__section">
        <h3 className="preferences-panel__heading">Recommendation Settings</h3>
        
        <div className="preferences-panel__sliders">
          {/* Price range */}
          <div className="preferences-panel__field">
            <div className="preferences-panel__row">
              <span className="preferences-panel__label">Price Range ($)</span>
              <span className="preferences-panel__range-val">
                ${preferences.priceRange[0]} - ${preferences.priceRange[1]}
              </span>
            </div>
            <div className="preferences-panel__slider-row">
              <Slider
                range
                min={0}
                max={100}
                value={preferences.priceRange}
                onChange={(val) => updatePref("priceRange", val as [number, number])}
                styles={sliderStyles}
              />
            </div>
          </div>

          {/* Review percentage range */}
          <div className="preferences-panel__field">
            <div className="preferences-panel__row">
              <span className="preferences-panel__label">Review Score (%)</span>
              <span className="preferences-panel__range-val">
                {preferences.reviewRange[0]}% - {preferences.reviewRange[1]}%
              </span>
            </div>
            <div className="preferences-panel__slider-row">
              <Slider
                range
                min={0}
                max={100}
                value={preferences.reviewRange}
                onChange={(val) => updatePref("reviewRange", val as [number, number])}
                styles={sliderStyles}
              />
            </div>
          </div>

          {/* Release year range */}
          <div className="preferences-panel__field">
            <div className="preferences-panel__row">
              <span className="preferences-panel__label">Release Year</span>
              <span className="preferences-panel__range-val">
                {preferences.releaseYearRange[0]} - {preferences.releaseYearRange[1]}
              </span>
            </div>
            <div className="preferences-panel__slider-row">
              <Slider
                range
                min={1970}
                max={new Date().getFullYear()}
                value={preferences.releaseYearRange}
                onChange={(val) => updatePref("releaseYearRange", val as [number, number])}
                styles={sliderStyles}
              />
            </div>
          </div>

          {/* Review count range */}
          <div className="preferences-panel__field">
            <div className="preferences-panel__row">
              <span className="preferences-panel__label">Total Reviews</span>
              <span className="preferences-panel__range-val">
                {preferences.reviewCountRange[0]} - {preferences.reviewCountRange[1] > 9999999 ? "1m+" : preferences.reviewCountRange[1]}
              </span>
            </div>
            <div className="preferences-panel__slider-row">
              <Slider
                range
                min={0}
                max={10000000}
                step={1000}
                value={preferences.reviewCountRange}
                onChange={(val) => updatePref("reviewCountRange", val as [number, number])}
                styles={sliderStyles}
              />
            </div>
          </div>

          {/* Randomizer Range*/}
          <div className="preferences-panel__field" style={{ marginBottom: "12px" }}>
            <div className="preferences-panel__row">
              <span className="preferences-panel__label">Randomization Factor</span>
              <span className="preferences-panel__range-val">
                {Math.round(preferences.randomizationFactor * 100)}%
              </span>
            </div>
            <div className="preferences-panel__slider-row">
              <Slider
                min={0}
                max={1}
                step={0.05}
                value={preferences.randomizationFactor}
                onChange={(val) => updatePref("randomizationFactor", val as number)}
                styles={sliderStyles}
              />
            </div>
          </div>

          {/* Prioritize games on sale toggle */}
          <label className="preferences-panel__checkbox">
            <input
              type="checkbox"
              checked={preferences.prioritizeSale}
              onChange={(e) => updatePref("prioritizeSale", e.target.checked)}
            />
            Prioritize Games on Sale
          </label>
        </div>
      </div>

      {/* Filter/Prioritize games/tags section */}
      <div className="preferences-panel__section" ref={containerRef}>
         <h3 className="preferences-panel__heading">Tags & Games</h3>
         <div className="preferences-panel__two-col">
            <div className="preferences-panel__field" style={{ position: "relative" }}>
              <span className="preferences-panel__label">Prioritize Tags</span>
              <div className="preferences-panel__input-wrap">
                <input 
                  type="text" 
                  className="preferences-panel__input" 
                  placeholder="Search tags..."
                  value={prioritizeTagSearch}
                  onFocus={() => {
                    setShowPrioritizeTagsDropdown(true);
                    setShowExcludeTagsDropdown(false);
                    setShowPrioritizeGamesDropdown(false);
                    setShowExcludeGamesDropdown(false);
                  }}
                  onChange={(e) => setPrioritizeTagSearch(e.target.value)}
                />
              </div>
              {showPrioritizeTagsDropdown && (
                <div className="preferences-panel__dropdown">
                  <div className="preferences-panel__tag-list-static">
                    {preferences.prioritizedTags.map(tag => (
                      <label key={`sel-${tag}`} className="preferences-panel__tag-checkbox">
                        <input 
                          type="checkbox" 
                          checked
                          onChange={() => updatePref("prioritizedTags", preferences.prioritizedTags.filter(t => t !== tag))}
                        />
                        {tag}
                      </label>
                    ))}
                    {allTags
                      .filter(tag => !preferences.prioritizedTags.includes(tag))
                      .filter(tag => tag.toLowerCase().includes(prioritizeTagSearch.toLowerCase()))
                      .sort((a, b) => a.localeCompare(b))
                      .map(tag => (
                        <label key={tag} className="preferences-panel__tag-checkbox">
                          <input 
                            type="checkbox" 
                            checked={false}
                            onChange={(e) => {
                              if (e.target.checked) updatePref("prioritizedTags", [...preferences.prioritizedTags, tag]);
                            }}
                          />
                          {tag}
                        </label>
                    ))}
                  </div>
                  {allTags.filter(tag => tag.toLowerCase().includes(prioritizeTagSearch.toLowerCase())).length === 0 && (
                    <span className="preferences-panel__no-results">No tags found</span>
                  )}
                </div>
              )}
            </div>
            
            <div className="preferences-panel__field" style={{ position: "relative" }}>
              <span className="preferences-panel__label">Exclude Tags</span>
              <div className="preferences-panel__input-wrap">
                <input 
                  type="text" 
                  className="preferences-panel__input" 
                  placeholder="Search tags..."
                  value={excludeTagSearch}
                  onFocus={() => {
                    setShowExcludeTagsDropdown(true);
                    setShowPrioritizeTagsDropdown(false);
                    setShowPrioritizeGamesDropdown(false);
                    setShowExcludeGamesDropdown(false);
                  }}
                  onChange={(e) => setExcludeTagSearch(e.target.value)}
                />
              </div>
              {showExcludeTagsDropdown && (
                <div className="preferences-panel__dropdown">
                  <div className="preferences-panel__tag-list-static">
                    {preferences.excludedTags.map(tag => (
                      <label key={`sel-${tag}`} className="preferences-panel__tag-checkbox">
                        <input 
                          type="checkbox" 
                          checked
                          onChange={() => updatePref("excludedTags", preferences.excludedTags.filter(t => t !== tag))}
                        />
                        {tag}
                      </label>
                    ))}
                    {allTags
                      .filter(tag => !preferences.excludedTags.includes(tag))
                      .filter(tag => tag.toLowerCase().includes(excludeTagSearch.toLowerCase()))
                      .sort((a, b) => a.localeCompare(b))
                      .map(tag => (
                        <label key={tag} className="preferences-panel__tag-checkbox">
                          <input 
                            type="checkbox" 
                            checked={false}
                            onChange={(e) => {
                              if (e.target.checked) updatePref("excludedTags", [...preferences.excludedTags, tag]);
                            }}
                          />
                          {tag}
                        </label>
                    ))}
                  </div>
                  {allTags.filter(tag => tag.toLowerCase().includes(excludeTagSearch.toLowerCase())).length === 0 && (
                    <span className="preferences-panel__no-results">No tags found</span>
                  )}
                </div>
              )}
            </div>
         </div>
         
         <br/>
         <div className="preferences-panel__two-col">
            <div className="preferences-panel__field" style={{ position: "relative" }}>
              <span className="preferences-panel__label">Prioritize Games</span>
              <div className="preferences-panel__input-wrap">
                <input 
                  type="text" 
                  className="preferences-panel__input" 
                  placeholder="Search game names or IDs..."
                  value={prioritizeGameSearch}
                  onFocus={() => {
                    setShowPrioritizeGamesDropdown(true);
                    setShowExcludeGamesDropdown(false);
                    setShowPrioritizeTagsDropdown(false);
                    setShowExcludeTagsDropdown(false);
                  }}
                  onChange={(e) => setPrioritizeGameSearch(e.target.value)}
                />
              </div>
              {showPrioritizeGamesDropdown && (
                <div className="preferences-panel__dropdown">
                  <div className="preferences-panel__tag-list-static">
                    {allGames
                      .filter(game => preferences.prioritizedGames.includes(game.id))
                      .map(game => (
                        <label key={`sel-${game.id}`} className="preferences-panel__tag-checkbox">
                          <input 
                            type="checkbox" 
                            checked
                            onChange={() => updatePref("prioritizedGames", preferences.prioritizedGames.filter(id => id !== game.id))}
                          />
                          {game.name}
                        </label>
                      ))}
                    {allGames
                      .filter(game => !preferences.prioritizedGames.includes(game.id))
                      .filter(game => game.name.toLowerCase().includes(prioritizeGameSearch.toLowerCase()) || game.id.toString().includes(prioritizeGameSearch))
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(game => (
                        <label key={game.id} className="preferences-panel__tag-checkbox">
                          <input 
                            type="checkbox" 
                            checked={false}
                            onChange={(e) => {
                              if (e.target.checked) updatePref("prioritizedGames", [...preferences.prioritizedGames, game.id]);
                            }}
                          />
                          {game.name}
                        </label>
                    ))}
                  </div>
                  {allGames.filter(game => game.name.toLowerCase().includes(prioritizeGameSearch.toLowerCase()) || game.id.toString().includes(prioritizeGameSearch)).length === 0 && (
                    <span className="preferences-panel__no-results">No games found</span>
                  )}
                </div>
              )}
            </div>
            
            <div className="preferences-panel__field" style={{ position: "relative" }}>
              <span className="preferences-panel__label">Exclude Games</span>
              <div className="preferences-panel__input-wrap">
                <input 
                  type="text" 
                  className="preferences-panel__input" 
                  placeholder="Search game names or IDs..."
                  value={excludeGameSearch}
                  onFocus={() => {
                    setShowExcludeGamesDropdown(true);
                    setShowPrioritizeGamesDropdown(false);
                    setShowPrioritizeTagsDropdown(false);
                    setShowExcludeTagsDropdown(false);
                  }}
                  onChange={(e) => setExcludeGameSearch(e.target.value)}
                />
              </div>
              {showExcludeGamesDropdown && (
                <div className="preferences-panel__dropdown">
                  <div className="preferences-panel__tag-list-static">
                    {allGames
                      .filter(game => preferences.excludedGames.includes(game.id))
                      .map(game => (
                        <label key={`sel-${game.id}`} className="preferences-panel__tag-checkbox">
                          <input 
                            type="checkbox" 
                            checked
                            onChange={() => updatePref("excludedGames", preferences.excludedGames.filter(id => id !== game.id))}
                          />
                          {game.name}
                        </label>
                      ))}
                    {allGames
                      .filter(game => !preferences.excludedGames.includes(game.id))
                      .filter(game => game.name.toLowerCase().includes(excludeGameSearch.toLowerCase()) || game.id.toString().includes(excludeGameSearch))
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(game => (
                        <label key={game.id} className="preferences-panel__tag-checkbox">
                          <input 
                            type="checkbox" 
                            checked={false}
                            onChange={(e) => {
                              if (e.target.checked) updatePref("excludedGames", [...preferences.excludedGames, game.id]);
                            }}
                          />
                          {game.name}
                        </label>
                    ))}
                  </div>
                  {allGames.filter(game => game.name.toLowerCase().includes(excludeGameSearch.toLowerCase()) || game.id.toString().includes(excludeGameSearch)).length === 0 && (
                    <span className="preferences-panel__no-results">No games found</span>
                  )}
                </div>
              )}
            </div>
         </div>
      </div>

      <div className="preferences-panel__section" style={{ display: "flex", justifyContent: "center", marginTop: "16px" }}>
        <button className="preferences-panel__reset-btn" onClick={handleReset}>
          Reset Settings
        </button>
      </div>

    </div>
  );
}
