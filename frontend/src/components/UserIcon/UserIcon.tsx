import { useEffect, useState } from "react";
import "./UserIcon.css";
import DefaultIcon from "../../assets/images/steam_default.png";
import ProfileFrame from "../../assets/images/Profile-Frame.png";

type SteamAuthUserResponse = {
  user: {
    steam_id: string;
    persona_name: string;
    avatar: string;
  };
};

export default function UserIcon() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const returnedSteamID = params.get("steamid");

    if (!returnedSteamID) return;

    fetch(`http://localhost:8080/api/auth/steam-user/${returnedSteamID}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch Steam auth user");
        }
        return res.json() as Promise<SteamAuthUserResponse>;
      })
      .then((data) => {
        setAvatarUrl(data.user.avatar);
      })
      .catch((err) => {
        console.error("Failed to load Steam avatar:", err);
      });
  }, []);

  return (
    <div className="user-icon">
      <img
        src={avatarUrl ?? DefaultIcon}
        alt={avatarUrl ? "Steam User Icon" : "Default User Icon"}
        className="avatar"
      />
      <img
        src={ProfileFrame}
        alt="Profile Frame"
        className="frame"
      />
    </div>
  );
}