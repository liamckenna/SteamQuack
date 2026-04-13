import { useState } from "react";
import "./Folder.css";
import SignInPanel from "./SignInPanel";
import DiagnosticsPanel from "./DiagnosticsPanel";
import PreferencesPanel from "./PreferencesPanel";
import PrescriptionPanel from "./PrescriptionPanel";

export type PreferencesState = {
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

export type TabId = "signin" | "diagnostics" | "preferences" | "prescription";

const TABS: { id: TabId; label: string }[] = [
  { id: "signin", label: "Sign in" },
  { id: "diagnostics", label: "Diagnostics" },
  { id: "preferences", label: "Preferences" },
  { id: "prescription", label: "Prescription" },
];

export default function Folder() {
  const [activeTab, setActiveTab] = useState<TabId>("signin");
  const [preferences, setPreferences] = useState<PreferencesState>({
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

  return (
    <div className="folder">
      <div className="folder-tabs">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={`folder-tab ${activeTab === id ? "folder-tab--active" : ""}`}
            onClick={() => setActiveTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="folder-panel">
        {activeTab === "signin" && <SignInPanel />}
        {activeTab === "diagnostics" && <DiagnosticsPanel />}
        {activeTab === "preferences" && (
          <PreferencesPanel 
            preferences={preferences} 
            setPreferences={setPreferences} 
          />
        )}
        {activeTab === "prescription" && (
          <PrescriptionPanel 
            preferences={preferences} 
          />
        )}
      </div>
    </div>
  );
}
