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
  title: string;
  reason: string;
};

export type RecommendationResponse = {
  recommendations: Recommendation[];
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
