export type ProfileParseRequest = {
  profile: string;
};

export type ProfileResult = {
  status: "not_found" | "private" | "public";
  name?: string;
  picture?: string;
  summary?: any;
};

export async function parseProfile(profile: string): Promise<ProfileResult> {
  const res = await fetch("/api/profile/parse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile } satisfies ProfileParseRequest),
  });

  // backend uses 404 for not_found, but still returns JSON
  const data = await res.json();

  // If it's a non-404 error, throw so UI can show a real error state
  if (!res.ok && res.status !== 404) {
    const errorMessage = data.error ? data.error : `parseProfile failed: ${res.status}`;
    throw new Error(errorMessage);
  }

  return data as ProfileResult;
}

export type RecommendationRequest = {
  profile: string;
  settings: Record<string, any>;
};

export type Recommendation = {
  game_id: number;
  score: number;
  name: string;
  description: string;
  initial_price: number;
  current_price: number;
  release_date_unix: number;
  review_count: number;
  review_percentage: number;
};

export type RecommendationResponse = {
  recommendations: Recommendation[];
};

export type OwnedGame = {
  appid: number;
  name: string;
  playtime_forever: number;
  playtime_2weeks: number;
}

export type DiagnosticsResponse = {
  total_playtime_minutes: number;
  most_played_game: OwnedGame;
  nichest_game: OwnedGame;
  recently_played: OwnedGame[];
  preferred_game_type: string;
  genres_breakdown: Record<string, number>;
  sub_genres_breakdown: Record<string, number>;
};

export async function getRecommendations(
  profile: string,
  settings: Record<string, any>,
): Promise<RecommendationResponse> {
  const res = await fetch("/api/recommendations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile, settings } satisfies RecommendationRequest),
  });

  if (!res.ok) {
    throw new Error(`getRecommendations failed: ${res.status}`);
  }

  return (await res.json()) as RecommendationResponse;
}

export async function getDiagnostics(
  profile: string,
): Promise<DiagnosticsResponse> {
  const res = await fetch("/api/user/diagnostics/" + profile, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error(`getDiagnostics failed: ${res.status}`);
  }

  return (await res.json()) as DiagnosticsResponse;
}

export type PreferencesOptionsResponse = {
  tags: string[];
  games: { id: number; name: string }[];
};

export async function getPreferencesOptions(): Promise<PreferencesOptionsResponse> {
  const res = await fetch("/api/preferences/options");
  if (!res.ok) {
    throw new Error(`getPreferencesOptions failed: ${res.status}`);
  }
  return (await res.json()) as PreferencesOptionsResponse;
}

export type UserProfileResponse = {
  user: {
    steam_id: string;
    persona_name: string;
    avatar: string;
  };
  owned_games_count: number;
  owned_games: {
    app_id: number;
    name: string;
    playtime_forever: number;
  }[];
};

export async function getUserProfile(steamid: string): Promise<UserProfileResponse> {
  const res = await fetch(`/api/user/profile/${steamid}`);
  if (!res.ok) {
    throw new Error(`getUserProfile failed: ${res.status}`);
  }
  return (await res.json()) as UserProfileResponse;
}
