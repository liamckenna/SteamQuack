import { useState } from "react";
import "./SignInPanel.css";

function SearchIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M10.5 18.5C14.9183 18.5 18.5 14.9183 18.5 10.5C18.5 6.08172 14.9183 2.5 10.5 2.5C6.08172 2.5 2.5 6.08172 2.5 10.5C2.5 14.9183 6.08172 18.5 10.5 18.5Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M21.5 21.5L16.75 16.75"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SteamLogo() {
  // Simple inline Steam-like mark (no external assets).
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle
        cx="32"
        cy="32"
        r="28"
        stroke="currentColor"
        strokeWidth="6"
        opacity="0.95"
      />
      <path
        d="M32 16L40 26.5L32 36L24 26.5L32 16Z"
        fill="currentColor"
        opacity="0.9"
      />
      <path
        d="M32 36L42 50.5H22L32 36Z"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  );
}

export default function SignInPanel() {
  const [query, setQuery] = useState("");

  function onSearchSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Backend logic intentionally out of scope for this UI change.
    // eslint-disable-next-line no-console
    console.log("Search Steam profile:", query);
  }

  function onSteamSignInClick() {
    // eslint-disable-next-line no-console
    console.log("Steam sign-in clicked");
  }

  return (
    <div className="signin-panel">
      <div className="signin-panel__instruction">
        Enter your Steam profile URL or unique username
      </div>

      <form onSubmit={onSearchSubmit}>
        <div className="signin-panel__input-row">
          <input
            className="signin-panel__input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="text"
            inputMode="url"
            autoComplete="off"
            aria-label="Steam profile URL or unique username"
          />
          <button
            className="signin-panel__search-btn"
            type="submit"
            aria-label="Search Steam profile"
          >
            <span className="signin-panel__search-icon">
              <SearchIcon />
            </span>
          </button>
        </div>
      </form>

      <div className="signin-panel__or">or sign in directly with Steam</div>

      <button
        className="signin-panel__steam-btn"
        type="button"
        onClick={onSteamSignInClick}
      >
        <span className="signin-panel__steam-logo">
          <SteamLogo />
        </span>
        <span>Sign in with Steam</span>
      </button>
    </div>
  );
}
