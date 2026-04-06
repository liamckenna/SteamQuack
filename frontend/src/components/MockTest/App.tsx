import { useMemo, useState } from "react";
import RandomGameDisplay from "../Test/RandomGameDisplay.tsx";
import { getRecommendations, parseProfile } from "../../api";
import type { ProfileResult, Recommendation } from "../../api";
import "./App.css";

function App() {
    const [profileInput, setProfileInput] = useState("");
    const [profileResult, setProfileResult] = useState<ProfileResult | null>(
        null,
    );
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);

    const [settingsText, setSettingsText] = useState(
        JSON.stringify({
            excluded_games: [],
            excluded_tags: [],
            prioritized_games: [],
            prioritized_tags: [],
            prioritize_games_on_sale: false,
            price_floor: 0.0,
            price_ceiling: 100.0,
            review_count_floor: 0,
            review_count_ceiling: 100000,
            review_percentage_floor: 0.0,
            review_percentage_ceiling: 100.0,
            release_year_floor: 1970,
            release_year_ceiling: new Date().getFullYear(),
            randomization_factor: 0.0,
            }, null, 2)
    );
    const [recs, setRecs] = useState<Recommendation[]>([]);
    const [recsLoading, setRecsLoading] = useState(false);
    const [recsError, setRecsError] = useState<string | null>(null);

    const parsedSettings = useMemo(() => {
        try {
            return {
                ok: true as const,
                value: JSON.parse(settingsText) as Record<string, any>,
            };
        } catch (e) {
            return { ok: false as const, value: null };
        }
    }, [settingsText]);

    async function onSubmitProfile(e: React.FormEvent) {
        e.preventDefault();
        setProfileError(null);
        setProfileResult(null);
        setProfileLoading(true);

        try {
            const result = await parseProfile(profileInput.trim());
            setProfileResult(result);
        } catch (err: any) {
            setProfileError(err?.message ?? "Failed to parse profile");
        } finally {
            setProfileLoading(false);
        }
    }

    async function onSubmitRecs(e: React.FormEvent) {
        e.preventDefault();
        setRecsError(null);
        setRecs([]);
        setRecsLoading(true);

        try {
            if (!parsedSettings.ok) {
                throw new Error("Settings JSON is invalid");
            }
            const resp = await getRecommendations(
                profileInput.trim(),
                parsedSettings.value!,
            );
            setRecs(resp.recommendations ?? []);
        } catch (err: any) {
            setRecsError(err?.message ?? "Failed to fetch recommendations");
        } finally {
            setRecsLoading(false);
        }
    }

    return (
        <div style={{ maxWidth: 700, margin: "0 auto", padding: 24 }}>
            <h1>SteamQuack</h1>

            <section style={{ marginTop: 24 }}>
                <h2>1–2) Profile Parse</h2>

                <form onSubmit={onSubmitProfile} style={{ display: "flex", gap: 8 }}>
                    <input
                        value={profileInput}
                        onChange={(e) => setProfileInput(e.target.value)}
                        placeholder='Try: "private" or "notfound" or anything'
                        style={{ flex: 1, padding: 8 }}
                    />
                    <button
                        type="submit"
                        disabled={profileLoading || !profileInput.trim()}
                    >
                        {profileLoading ? "Checking..." : "Send"}
                    </button>
                </form>

                {profileError && <p style={{ marginTop: 8 }}>Error: {profileError}</p>}

                {profileResult && (
                    <div
                        style={{
                            marginTop: 12,
                            padding: 12,
                            border: "1px solid #333",
                            borderRadius: 8,
                        }}
                    >
                        <div>Status: {profileResult.status}</div>
                        {profileResult.name && <div>Name: {profileResult.name}</div>}
                        {profileResult.picture && (
                            <div>Picture: {profileResult.picture}</div>
                        )}
                        {profileResult.summary && (
                            <>
                                <div style={{ marginTop: 8 }}>Summary:</div>
                                <pre style={{ whiteSpace: "pre-wrap" }}>
                                    {JSON.stringify(profileResult.summary, null, 2)}
                                </pre>
                            </>
                        )}
                    </div>
                )}
            </section>

            <section style={{ marginTop: 24 }}>
                <h2>3–4) Recommendations</h2>

                <form onSubmit={onSubmitRecs}>
                    <div style={{ marginTop: 8 }}>Settings (JSON):</div>
                    <textarea
                        value={settingsText}
                        onChange={(e) => setSettingsText(e.target.value)}
                        rows={7}
                        style={{
                            width: "100%",
                            padding: 8,
                            marginTop: 8,
                            fontFamily: "monospace",
                        }}
                    />
                    <div
                        style={{
                            display: "flex",
                            gap: 8,
                            marginTop: 8,
                            alignItems: "center",
                        }}
                    >
                        <button
                            type="submit"
                            disabled={
                                recsLoading || !profileInput.trim() || !parsedSettings.ok
                            }
                        >
                            {recsLoading ? "Loading..." : "Get Recommendations"}
                        </button>
                        {!parsedSettings.ok && <span>Settings JSON is invalid</span>}
                    </div>
                </form>

                {recsError && <p style={{ marginTop: 8 }}>Error: {recsError}</p>}

                {recs.length > 0 && (
                    <ul style={{ marginTop: 12 }}>
                        {recs.map((r, idx) => (
                            <li key={idx} style={{ marginBottom: 8 }}>
                                <div>
                                    <strong>{r.name}</strong>
                                </div>
                                <div>Score: {r.score}</div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <section style={{ marginTop: 24 }}>
                <h2>Random Game Test</h2>

                <RandomGameDisplay />
            </section>
        </div>
    );
}

export default App;