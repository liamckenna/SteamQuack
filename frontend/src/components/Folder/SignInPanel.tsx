import { useEffect, useState } from "react";
import "./SignInPanel.css";
import SteamLogoImage from "../../assets/images/Steam_icon_logo.png";

function SearchIcon() {
  return <span className="signin-panel__search-icon">⌕</span>;
}

type SteamProfileResponse = {
  user: {
    steam_id: string;
    persona_name: string;
    avatar: string;
  };
  owned_games_count: number;
  owned_games: Array<{
    app_id: number;
    name: string;
    playtime_forever: number;
  }>;
};

type SteamAuthUserResponse = {
  user: {
    steam_id: string;
    persona_name: string;
    avatar: string;
  };
};

type ProfileParseResponse = {
  status: string;
  name: string;
  picture: string;
  steam_id: string;
  summary: {
    games_count: number;
    games: Array<{
      app_id: number;
      name: string;
      playtime_forever: number;
    }>;
  };
};

export default function SignInPanel() {
  const [query, setQuery] = useState("");
  const [steamID, setSteamID] = useState<string | null>(null);
  const [steamName, setSteamName] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const returnedSteamID = params.get("steamid");

    if (!returnedSteamID) return;

    setSteamID(returnedSteamID);
    setIsLoadingProfile(true);

    fetch(`http://localhost:8080/api/auth/steam-user/${returnedSteamID}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch Steam auth user");
        }
        return res.json() as Promise<SteamAuthUserResponse>;
      })
      .then((data) => {
        setSteamName(data.user.persona_name);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setIsLoadingProfile(false);
      });
  }, []);

  async function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmedQuery = query.trim();
    console.log("query:", trimmedQuery);

    if (!trimmedQuery) {
      alert("query is empty");
      return;
    }

    try {
      const res = await fetch("http://localhost:8080/api/profile/parse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ profile: trimmedQuery }),
      });

      console.log("parse status:", res.status);

      const data = await res.json().catch(() => null);
      console.log("parse data:", data);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to parse Steam profile");
      }

      const resolvedSteamID = data?.steam_id;

      if (!resolvedSteamID) {
        throw new Error("No steam_id returned from profile parse");
      }

      window.location.href = `${window.location.origin}/?steamid=${resolvedSteamID}`;
    } catch (err) {
      console.error("Textbox search failed:", err);
      alert(err instanceof Error ? err.message : "Textbox search failed");
    }
  }
  function onSteamSignInClick() {
    window.location.href = "http://localhost:8080/auth/steam/login";
  }

  function onSignOut() {
    const url = new URL(window.location.href);
    url.searchParams.delete("steamid");
    window.location.href = url.pathname + url.search;
  }

  if (steamID) {
    return (
      <div className="signin-panel">
        <div className="signin-panel__welcome">
          <h2 className="signin-panel__welcome-title">
            {isLoadingProfile
              ? "Signing you in..."
              : `Welcome, ${steamName ?? "Steam user"}`}
          </h2>

          <p className="signin-panel__welcome-subtitle">Steam ID: {steamID}</p>

          <button
            type="button"
            className="signin-panel__signout-btn"
            onClick={onSignOut}
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="signin-panel">
      <p className="signin-panel__instruction">
        Enter your Steam profile URL or unique username
      </p>

      <form className="signin-panel__input-row" onSubmit={onSearchSubmit}>
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
          type="submit"
          className="signin-panel__search-btn"
          aria-label="Search Steam profile"
        >
          <SearchIcon />
        </button>
      </form>

      <p className="signin-panel__or">or sign in directly with Steam</p>

      <button
        type="button"
        className="signin-panel__steam-btn"
        onClick={onSteamSignInClick}
      >
        <img
          src={SteamLogoImage}
          alt="Steam"
          className="signin-panel__steam-logo-img"
        />
        <span>Sign in with Steam</span>
      </button>
    </div>
  );
}
