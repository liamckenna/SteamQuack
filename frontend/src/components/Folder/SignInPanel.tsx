import { useEffect, useState, useRef } from "react";
import "./SignInPanel.css";
import SteamLogoImage from "../../assets/images/Steam_icon_logo.png";
import { useDialogue } from "../../context/DialogueContext";
import { getUserProfile } from "../../api";
import FolderPager from "./FolderPager";

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
    public: boolean;
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

type SignInPanelProps = {
  onAuthStateChange: (authenticated: boolean) => void;
};

export default function SignInPanel({ onAuthStateChange }: SignInPanelProps) {
  const [query, setQuery] = useState("");
  const [steamID, setSteamID] = useState<string | null>(null);
  const [steamName, setSteamName] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isProfilePublic, setIsProfilePublic] = useState(true);



  const { startDialogue, resetDialogue, lockDialogue, unlockDialogue } = useDialogue();

  const completedLoginFor = useRef<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const returnedSteamID = params.get("steamid");

    if (!returnedSteamID) {
      setIsProfilePublic(true);
      onAuthStateChange(false);
      return;
    }

    if (completedLoginFor.current === returnedSteamID) return;

    setSteamID(returnedSteamID);
    setIsLoadingProfile(true);

    completedLoginFor.current = returnedSteamID;

    unlockDialogue();
    lockDialogue();

    fetch(`http://localhost:8080/api/auth/steam-user/${returnedSteamID}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch Steam auth user");
        }
        return res.json() as Promise<SteamAuthUserResponse>;
      })
      .then(async (data) => {
        setSteamName(data.user.persona_name);
        setIsProfilePublic(data.user.public);

        if (!data.user.public) {
          unlockDialogue();
          startDialogue("signInPrivate");
          onAuthStateChange(false);
          return;
        }

        try {
          const profileData = await getUserProfile(returnedSteamID);
          const ownedGames = profileData.owned_games || [];

          const totalPlaytime = ownedGames.reduce((sum: number, game: any) => sum + (game.playtime_forever || 0), 0);

          if (totalPlaytime > 0) {
            unlockDialogue();
            startDialogue("signInSuccess", { username: data.user.persona_name });
            lockDialogue();

            setTimeout(() => {
              unlockDialogue();
            }, 1000);

            completedLoginFor.current = returnedSteamID;

            onAuthStateChange(true);

          } else {
            unlockDialogue();
            startDialogue("signInPrivatePlaytimes");
            setIsProfilePublic(false);
            onAuthStateChange(false);
          }
        } catch (err) {
          console.error("Failed to fetch games for playtime check", err);
          unlockDialogue();
          if (data.user.public) {
            startDialogue("signInPrivatePlaytimes");
            setIsProfilePublic(false);
            onAuthStateChange(false);
          } else {
            startDialogue("signInFailure");
          }
        }
      })
      .catch((err) => {
        console.error(err);
        unlockDialogue();
        startDialogue("signInFailure");
        onAuthStateChange(false);
        setIsProfilePublic(true);
      })
      .finally(() => {
        setIsLoadingProfile(false);
      });
  }, [onAuthStateChange, startDialogue, lockDialogue, unlockDialogue]);

  async function onSearchSubmit(e: React.FormEvent) {
    startDialogue("fetchingProfile");

    lockDialogue();
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
      unlockDialogue();
      startDialogue("signInFailure");
    }
  }
  function onSteamSignInClick() {
    window.location.href = "http://localhost:8080/auth/steam/login";
  }

  function onSignOut() {
    onAuthStateChange(false);

    setSteamID(null);
    setSteamName(null);
    completedLoginFor.current = null;
    
    resetDialogue("signInSuccess");
    
    unlockDialogue();
    startDialogue("signOutSuccess");

    const url = new URL(window.location.href);
    url.searchParams.delete("steamid");
    window.history.replaceState({}, "", url.pathname + url.search);
    window.dispatchEvent(new Event("steamid-changed"));
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
          {!isLoadingProfile && !isProfilePublic && (
            <div className="signin-panel__private-warning">
              <p className="signin-panel__private-warning-text">
                Recommendations can only be generated if your game details are public and
                the "Always keep my total playtime private" option is unchecked.
              </p>
              <a
                className="signin-panel__private-warning-link"
                href="https://help.steampowered.com/en/faqs/view/588C-C67D-0251-C276"
                target="_blank"
                rel="noreferrer"
              >
                Make your Steam profile public
              </a>
            </div>
          )}
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
          onClick={() => startDialogue("steamURLInstruction")}
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
