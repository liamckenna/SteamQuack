import './DiagnosticsPanel.css';
import { useEffect, useState } from 'react';
import { getDiagnostics, type DiagnosticsResponse } from "../../api";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

// --- Helper Functions ---
const minutesToHours = (minutes: number) => (minutes / 60).toFixed(1);

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

// Colors
const GENRE_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#64748b'];
const SUBGENRE_COLORS = ['#6366f1', '#a855f7', '#f43f5e', '#14b8a6', '#64748b'];

// --- Component ---
export default function DiagnosticsPanel() {
  const [data, setData] = useState<DiagnosticsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const queryParams = new URLSearchParams(window.location.search);
  const userID = queryParams.get('steamid');

  if (!userID) return <div>Please sign in first.</div>;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getDiagnostics(userID);
        setData(result);
      } catch (err) {
        setError('Failed to fetch diagnostics.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userID]);

  if (loading) return <div className="diagnostics-panel">Loading diagnostics...</div>;
  if (error) return <div className="diagnostics-panel">{error}</div>;
  if (!data) return null;

  const genreData = processChartData(data.genres_breakdown);
  const subGenreData = processChartData(data.sub_genres_breakdown);
  
  const topGenre = getTopItem(data.genres_breakdown);
  const topSubGenre = getTopItem(data.sub_genres_breakdown);

  return (
    <div className="diagnostics-panel">
      
      {/* Stats Section */}
      <section className="diagnostics-panel__section">
        <h2 className="diagnostics-panel__heading">Player Stats</h2>
        <dl className="diagnostics-panel__stats">
          <div className="diagnostics-panel__stat">
            <dt>Total Playtime</dt>
            <dd>{minutesToHours(data.total_playtime_minutes)} hrs</dd>
          </div>
          <div className="diagnostics-panel__stat">
            <dt>Most Played</dt>
            <dd>
              {data.most_played_game.name} ({minutesToHours(data.most_played_game.playtime_minutes)} hrs)
            </dd>
          </div>
          <div className="diagnostics-panel__stat">
            <dt>Nichest Game</dt>
            <dd>
              {data.nichest_game.name} ({minutesToHours(data.nichest_game.playtime_minutes)} hrs)
            </dd>
          </div>
        </dl>

        {/* Dream Game Section */}
        <div className="diagnostics-panel__dream-game">
          <h3 className="diagnostics-panel__dream-title">Your Dream Game</h3>
          <p className="diagnostics-panel__dream-desc">
            Based on your habits, you'd love a <strong>{topGenre}</strong> game that focuses heavily on being <strong>{topSubGenre}</strong>.
          </p>
        </div>
      </section>

      {/* Charts Section */}
      <section className="diagnostics-panel__section">
        <h2 className="diagnostics-panel__heading">Library Breakdown</h2>
        <div className="diagnostics-panel__charts">
          
          {/* Genres Chart */}
          <div>
            <h3 className="diagnostics-panel__dream-title" style={{ fontSize: '0.85rem' }}>Genres</h3>
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
                      <Cell key={`cell-${index}`} fill={GENRE_COLORS[index % GENRE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '4px', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sub-genres Chart */}
          <div>
            <h3 className="diagnostics-panel__dream-title" style={{ fontSize: '0.85rem' }}>Sub-Genres</h3>
            <div className="diagnostics-panel__pie-wrap" style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subGenreData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={65}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {subGenreData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SUBGENRE_COLORS[index % SUBGENRE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
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