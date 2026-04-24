import { useState, useRef, useEffect } from "react";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import "./PreferencesPanel.css";
import { getPreferencesOptions, getUserProfile } from "../../api";
import type { PreferencesState } from "./Folder";
import { useDialogue } from "../../context/DialogueContext";

type GameOption = { id: number; name: string };

type PreferencesPanelProps = {
  preferences: PreferencesState;
  setPreferences: React.Dispatch<React.SetStateAction<PreferencesState>>;
};

const REVIEWS_MAX_DISPLAY = 1000000;
const REVIEWS_SLIDER_MAX = 10000;

function valToReviewSlider(val: number): number {
  if (val >= Number.MAX_SAFE_INTEGER || val >= REVIEWS_MAX_DISPLAY) return REVIEWS_SLIDER_MAX;

  return Math.round(Math.pow(val / REVIEWS_MAX_DISPLAY, 1 / 4) * REVIEWS_SLIDER_MAX);
}

function reviewSliderToVal(sliderVal: number): number {
  if (sliderVal === REVIEWS_SLIDER_MAX) return Number.MAX_SAFE_INTEGER;

  const raw = REVIEWS_MAX_DISPLAY * Math.pow(sliderVal / REVIEWS_SLIDER_MAX, 4);

  if (raw < 100) return Math.round(raw);
  if (raw < 1000) return Math.round(raw / 10) * 10;
  if (raw < 10000) return Math.round(raw / 100) * 100;
  if (raw < 50000) return Math.round(raw / 500) * 500;
  if (raw < 100000) return Math.round(raw / 1000) * 1000;
  return Math.round(raw / 10000) * 10000;
}

export default function PreferencesPanel({ preferences, setPreferences }: PreferencesPanelProps) {
  const [allTags, setAllTags] = useState<string[]>([]);
  const [allGames, setAllGames] = useState<GameOption[]>([]);
  const { startDialogue } = useDialogue();
  const hasInitialized = useRef(false);

  // load from backend on mount
  useEffect(() => {
    async function loadOptions() {
      try {
        const data = await getPreferencesOptions();
        setAllTags(data.tags || []);
        
        const params = new URLSearchParams(window.location.search);
        const steamid = params.get("steamid");
        if (steamid) {
          const profileData = await getUserProfile(steamid);
          const ownedGamesMap = (profileData.owned_games || []).map(g => ({
            id: g.app_id,
            name: g.name
          }));
          setAllGames(ownedGamesMap);
        } else {
          // if somehow not logged in and accessing the panel
          setAllGames(data.games || []);
        }
      } catch (err) {
        console.error("Failed to load from database:", err);
      }
    }
    loadOptions();
  }, []);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    startDialogue("openPreferences");
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
    track: { backgroundColor: "var(--color-accent)" },
    handle: { borderColor: "var(--color-accent)", backgroundColor: "var(--color-accent)" },
    rail: { backgroundColor: "var(--color-bg-secondary)" }
  };

  const handleReset = () => {
    setPreferences({
      priceRange: [0, Number.MAX_SAFE_INTEGER],
      reviewRange: [0, 100],
      releaseYearRange: [1970, new Date().getFullYear()],
      reviewCountRange: [0, Number.MAX_SAFE_INTEGER],
      prioritizeSale: false,
      prioritizeRecentPlaytime: false,
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
        <div className="preferences-panel__sliders">

          <div className="preferences-panel__field">
            <div className="preferences-panel__row">
              <span className="preferences-panel__label">Price Range ($)</span>
              <span className="preferences-panel__range-val">
                ${preferences.priceRange[0]} - {
                  preferences.priceRange[1] === Number.MAX_SAFE_INTEGER
                    ? "$100+"
                    : `$${preferences.priceRange[1]}`
                }
              </span>
            </div>
            <div className="preferences-panel__slider-row">
              <Slider
                range
                min={0}
                max={100}
                value={[
                  preferences.priceRange[0],
                  preferences.priceRange[1] === Number.MAX_SAFE_INTEGER ? 100 : preferences.priceRange[1]
                ]}
                onChange={(val) => {
                  const [min, max] = val as [number, number];
                  updatePref("priceRange", [min, max === 100 ? Number.MAX_SAFE_INTEGER : max]);
                  startDialogue("priceRange");
                }}
                styles={sliderStyles}
              />
            </div>
          </div>

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
                onChange={(val) => {
                  updatePref("reviewRange", val as [number, number]);
                  startDialogue("reviewRange");
                }}
                styles={sliderStyles}
              />
            </div>
          </div>

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
                onChange={(val) => {
                  updatePref("releaseYearRange", val as [number, number]);
                  startDialogue("releaseYearRange");
                }}
                styles={sliderStyles}
              />
            </div>
          </div>

          <div className="preferences-panel__field">
            <div className="preferences-panel__row">
              <span className="preferences-panel__label">Total Reviews</span>
              <span className="preferences-panel__range-val">
                {preferences.reviewCountRange[0].toLocaleString()} - {
                  preferences.reviewCountRange[1] === Number.MAX_SAFE_INTEGER
                    ? "1m+"
                    : preferences.reviewCountRange[1].toLocaleString()
                }
              </span>
            </div>
            <div className="preferences-panel__slider-row">
              <Slider
                range
                min={0}
                max={REVIEWS_SLIDER_MAX}
                step={1}
                value={[
                  valToReviewSlider(preferences.reviewCountRange[0]),
                  valToReviewSlider(preferences.reviewCountRange[1])
                ]}
                onChange={(val) => {
                  const [minSlider, maxSlider] = val as [number, number];
                  updatePref("reviewCountRange", [
                    reviewSliderToVal(minSlider),
                    reviewSliderToVal(maxSlider)
                  ]);
                  startDialogue("reviewCountRange");
                }}
                styles={sliderStyles}
              />
            </div>
          </div>

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
                step={0.01}
                value={preferences.randomizationFactor}
                onChange={(val) => {
                  updatePref("randomizationFactor", val as number);
                  startDialogue("randomizationFactor");
                }}
                styles={sliderStyles}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            <label className="preferences-panel__checkbox" style={{ margin: 0 }}>
              <input
                type="checkbox"
                checked={preferences.prioritizeSale}
                onChange={(e) => {
                  updatePref("prioritizeSale", e.target.checked);
                  startDialogue("prioritizeSale");
                }}
              />
              Prioritize Games on Sale
            </label>

            <label className="preferences-panel__checkbox" style={{ margin: 0 }}>
              <input
                type="checkbox"
                checked={preferences.prioritizeRecentPlaytime}
                onChange={(e) => {
                  updatePref("prioritizeRecentPlaytime", e.target.checked);
                  startDialogue("prioritizeRecentPlaytime");
                }}
              />
              Prioritize Recent Playtime
            </label>
          </div>
        </div>
      </div>

      <div className="preferences-panel__section" ref={containerRef}>
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
                    startDialogue("prioritizeTagsSearch");
                  }}
                onChange={(e) => {
                  setPrioritizeTagSearch(e.target.value) 
                  
                }}
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
                    startDialogue("excludeTagsSearch");
                  }}
                  onChange={(e) => {
                    setExcludeTagSearch(e.target.value);
                  }}
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
                    startDialogue("prioritizeGamesSearch");
                  }}
                  onChange={(e) => {
                    setPrioritizeGameSearch(e.target.value);
                  }}
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
                    startDialogue("excludeGamesSearch");
                  }}
                  onChange={(e) => {
                    setExcludeGameSearch(e.target.value);
                  }}
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
