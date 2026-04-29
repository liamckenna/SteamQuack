import './DiagnosticsPanel.css';
import { useEffect, useState, useRef } from 'react';
import { getDiagnostics, type DiagnosticsResponse } from "../../api";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, type RenderableText, type TooltipValueType } from 'recharts';
import { useDialogue } from "../../context/DialogueContext";
import FolderPager from './FolderPager';


// --- Helper Functions ---
const minutesToHours = (minutes: number) => (minutes / 60).toFixed(1);

const formatPercent = (value: RenderableText | TooltipValueType): string => {
  return `${Number(value).toFixed(1)}%`;
}

const processChartData = (data: Record<string, number>, minNumValues = 15) => {
  let done = false;
  let totalValue = 0;
  let otherValue = 0;
  let numValuesAdded = 0;
  let maxValue = Object.entries(data).reduce((sum, item) => sum + item[1], 0);
  const processed = Object.entries(data).sort((a, b) => b[1] - a[1]).reduce((acc, [name, value]) => {
    if (done) {
      return acc;
    }

    // For "Other" as smallest: && (maxValue - (totalValue + value) < value)
    if ((numValuesAdded + 1 >= minNumValues)) {
      totalValue += value;
      otherValue = maxValue - totalValue;
      acc.push({ name, value });
      numValuesAdded++;
      done = true;
    } else {
      totalValue += value;
      otherValue = maxValue - totalValue
      acc.push({ name, value });
      numValuesAdded++
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  if (otherValue > 0) {
    processed.push({ name: 'Other', value: otherValue });
  }
  
  return processed;
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

  const superGenreData = processChartData(data.super_genres_breakdown);
  const genreData = processChartData(data.genres_breakdown);
  const subGenreData = processChartData(data.sub_genres_breakdown);
  const visualsViewpointsData = processChartData(data.visuals_viewpoints_breakdown);
  const themesMoodsData = processChartData(data.themes_moods_breakdown);
  const featuresData = processChartData(data.features_breakdown);
  const playersData = processChartData(data.players_breakdown);
  const assessmentsData = processChartData(data.assessments_breakdown);
  
  const topSuperGenre = getTopItem(data.super_genres_breakdown);
  const topGenre = getTopItem(data.genres_breakdown);
  const topSubGenre = getTopItem(data.sub_genres_breakdown);
  const topVisualsViewpoints = getTopItem(data.visuals_viewpoints_breakdown);
  const topThemesMoods = getTopItem(data.themes_moods_breakdown);
  const topFeatures = getTopItem(data.features_breakdown);
  const topPlayers = getTopItem(data.players_breakdown);
  const topAssessments = getTopItem(data.assessments_breakdown);

  const _preferredGameTypeAlt =
    <p className="diagnostics-panel__dream-desc">
      Based on your habits, you'd love a <strong>{topAssessments} {topSuperGenre} {topGenre} {topSubGenre}</strong>, with <strong>{topVisualsViewpoints} {topThemesMoods}</strong> elements, and <strong>{topFeatures} {topPlayers}</strong> gameplay.
    </p>
  
  const preferredGameType =
    <p className="diagnostics-panel__dream-desc">
      Based on your habits, you'd love a <strong>{data.preferred_game_type || "Unknown"}</strong>.
    </p>

  const page1 =
    <>
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
        <h2 className="diagnostics-panel__heading">Top 3 Recently Played (2 Weeks)</h2>
        {(!data.recently_played || data.recently_played.length === 0) && (
          <p>No recently played games.</p>
        )}
        {data.recently_played && data.recently_played.length > 0 && (
          <div className="diagnostics-panel__recently-played">
            {data.recently_played.sort((a, b) => b.playtime_2weeks - a.playtime_2weeks).slice(0, 3).map((game, idx) => (
              <figure key={game.appid || idx}>
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
          {preferredGameType}
        </div>
      </section>
    </>

  const page2 =
    <>
      {/* Charts Section */}
      <section className="diagnostics-panel__section">
        <h2 className="diagnostics-panel__heading">Library Breakdown</h2>
        <div className="diagnostics-panel__charts">
          
          {/* Super-Genres Chart */}
          <div className="diagnostics-panel__chart-wrapper">
            <h3 className="diagnostics-panel__heading" style={{ fontSize: '0.85rem' }}>Super-Genres</h3>
            <div className="diagnostics-panel__pie-wrap" style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={superGenreData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {genreData.map((_entry, index) => (
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
                    {subGenreData.map((_entry, index) => (
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

          {/* Sub-Genres Chart */}
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
                    {subGenreData.map((_entry, index) => (
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

          {/* Visuals & Viewpoints Chart */}
          <div className="diagnostics-panel__chart-wrapper">
            <h3 className="diagnostics-panel__heading" style={{ fontSize: '0.85rem' }}>Visuals & Viewpoints</h3>
            <div className="diagnostics-panel__pie-wrap" style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={visualsViewpointsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {subGenreData.map((_entry, index) => (
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
    </>
  
  const page3 =
    <>
      {/* Charts Section */}
      <section className="diagnostics-panel__section">
        <h2 className="diagnostics-panel__heading">Library Breakdown</h2>
        <div className="diagnostics-panel__charts">
          
          {/* Themes & Moods Chart */}
          <div className="diagnostics-panel__chart-wrapper">
            <h3 className="diagnostics-panel__heading" style={{ fontSize: '0.85rem' }}>Themes & Moods</h3>
            <div className="diagnostics-panel__pie-wrap" style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={themesMoodsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {genreData.map((_entry, index) => (
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

          {/* Features Chart */}
          <div className="diagnostics-panel__chart-wrapper">
            <h3 className="diagnostics-panel__heading" style={{ fontSize: '0.85rem' }}>Features</h3>
            <div className="diagnostics-panel__pie-wrap" style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={featuresData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {subGenreData.map((_entry, index) => (
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

          {/* Players Chart */}
          <div className="diagnostics-panel__chart-wrapper">
            <h3 className="diagnostics-panel__heading" style={{ fontSize: '0.85rem' }}>Players</h3>
            <div className="diagnostics-panel__pie-wrap" style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={playersData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {subGenreData.map((_entry, index) => (
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

          {/* Assessments Chart */}
          <div className="diagnostics-panel__chart-wrapper">
            <h3 className="diagnostics-panel__heading" style={{ fontSize: '0.85rem' }}>Assessments</h3>
            <div className="diagnostics-panel__pie-wrap" style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assessmentsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {subGenreData.map((_entry, index) => (
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
    </>

  return (
    <div className="diagnostics-panel">
      <FolderPager pages={[page1, page2, page3]} />
    </div>
  );
};