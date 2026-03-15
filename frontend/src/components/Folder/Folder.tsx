import { useState } from "react";
import "./Folder.css";
import SignInPanel from "./SignInPanel";
import DiagnosticsPanel from "./DiagnosticsPanel";
import PreferencesPanel from "./PreferencesPanel";
import PrescriptionPanel from "./PrescriptionPanel";

export type TabId = "signin" | "diagnostics" | "preferences" | "prescription";

const TABS: { id: TabId; label: string }[] = [
  { id: "signin", label: "Sign in" },
  { id: "diagnostics", label: "Diagnostics" },
  { id: "preferences", label: "Preferences" },
  { id: "prescription", label: "Prescription" },
];

export default function Folder() {
  const [activeTab, setActiveTab] = useState<TabId>("signin");

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
        {activeTab === "preferences" && <PreferencesPanel />}
        {activeTab === "prescription" && <PrescriptionPanel />}
      </div>
    </div>
  );
}
