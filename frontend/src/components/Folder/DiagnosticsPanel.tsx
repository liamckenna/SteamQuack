import './DiagnosticsPanel.css';
import { useEffect, useState, useRef } from 'react';
import { getDiagnostics, type DiagnosticsResponse } from "../../api";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, type RenderableText, type TooltipValueType } from 'recharts';
import { useDialogue } from "../../context/DialogueContext";


// --- Helper Functions ---
const minutesToHours = (minutes: number) => (minutes / 60).toFixed(1);

const formatPercent = (value: RenderableText | TooltipValueType): string => {
  return `${Number(value).toFixed(1)}%`;
}

const processChartData = (data: Record<string, number>, threshold = 5) => {
  let otherValue = 0;
  const processed = Object.entries(data).reduce((acc, [name, value]) => {
    if (value < threshold) {
      otherValue += value;
    } else {
      acc.push({ name, value });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  if (otherValue > 0) {
    processed.push({ name: 'Other', value: otherValue });
  }
  
  return processed.sort((a, b) => b.value - a.value);
};

const getTopItem = (data: Record<string, number>) => {
  const entries = Object.entries(data);
  if (entries.length === 0) return "Unknown";
  return entries.reduce((a, b) => (a[1] > b[1] ? a : b))[0];
};

// --- Colors ---
const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#a855f7', '#f43f5e', '#14b8a6'];

// --- Component ---
export default function DiagnosticsPanel() {

  const [data, setData] = useState<DiagnosticsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const queryParams = new URLSearchParams(window.location.search);
  const userID = queryParams.get('steamid');
  const { startDialogue } = useDialogue();
  const hasInitialized = useRef(false);

  if (!userID) return <div>Please sign in first.</div>;

  useEffect(() => {
    const fetchDiagnostics = async () => {
      try {
        setLoading(true);
        const result = await getDiagnostics(userID);
        setData(result);
        if (hasInitialized.current) return;
        hasInitialized.current = true;
        startDialogue("openDiagnostics");
      } catch (err) {
        setError('Failed to fetch diagnostics.');
      } finally {
        setLoading(false);
      }
    };

    fetchDiagnostics();
  }, [userID]);

  if (loading) return <div className="diagnostics-panel">Loading diagnostics...</div>;
  if (error) return <div className="diagnostics-panel">{error}</div>;
  if (!data || data.most_played_game == null) return <div className="diagnostics-panel">No diagnostics returned.</div>;

  const genreData = processChartData(data.genres_breakdown);
  const subGenreData = processChartData(data.sub_genres_breakdown);
  
  const topGenre = getTopItem(data.genres_breakdown);
  const topSubGenre = getTopItem(data.sub_genres_breakdown);

  return (
    <div className="diagnostics-panel">
      
      {/* Statistics Section */}
      <section className="diagnostics-panel__section">
        <h2 className="diagnostics-panel__heading">Player Statistics</h2>
        <dl className="diagnostics-panel__stats">
          <div className="diagnostics-panel__stat">
            <dt>Total Playtime</dt>
            <dd>{minutesToHours(data.total_playtime_minutes)} hrs</dd>
          </div>
          <div className="diagnostics-panel__stat">
            <dt>Most Played</dt>
            <dd>
              {data.most_played_game.name} ({minutesToHours(data.most_played_game.playtime_forever)} hrs)
            </dd>
          </div>
          <div className="diagnostics-panel__stat">
            <dt>Nichest Game</dt>
            <dd>
              {data.nichest_game.name} ({minutesToHours(data.nichest_game.playtime_forever)} hrs)
            </dd>
          </div>
        </dl>

        {/* Recently Played Section */}
        <h2 className="diagnostics-panel__heading">Recently Played (2 Weeks)</h2>
        {data.recently_played.length == 0 && (
          <p>No recently played games.</p>
        )}
        {data.recently_played.length > 0 && (
          <div className="diagnostics-panel__recently-played">
            {data.recently_played.map((game) => (
              <figure>
                <img src={`https://steamcdn-a.akamaihd.net/steam/apps/${game.appid}/header.jpg`}/>
                <figcaption>{game.name}</figcaption>
                <figcaption>({minutesToHours(game.playtime_2weeks)} hrs)</figcaption>
              </figure>
            ))}
          </div>
        )}

        {/* Dream Game Section */}
        <div className="diagnostics-panel__dream-game">
          <h3 className="diagnostics-panel__dream-title">Your Dream Game</h3>
          <p className="diagnostics-panel__dream-desc">
            Based on your habits, you'd love a <strong>{topGenre}</strong> <strong>{topSubGenre}</strong>.
          </p>
        </div>
      </section>

      {/* Charts Section */}
      <section className="diagnostics-panel__section">
        <h2 className="diagnostics-panel__heading">Library Breakdown</h2>
        <div className="diagnostics-panel__charts">
          
          {/* Genres Chart */}
          <div className="diagnostics-panel__chart-wrapper">
            <h3 className="diagnostics-panel__heading" style={{ fontSize: '0.85rem' }}>Genres</h3>
            <div className="diagnostics-panel__pie-wrap" style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genreData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {genreData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={formatPercent}
                    contentStyle={{ background: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '4px', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sub-genres Chart */}
          <div className="diagnostics-panel__chart-wrapper">
            <h3 className="diagnostics-panel__heading" style={{ fontSize: '0.85rem' }}>Sub-Genres</h3>
            <div className="diagnostics-panel__pie-wrap" style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subGenreData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {subGenreData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={formatPercent}
                    contentStyle={{ background: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '4px', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};