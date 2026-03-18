import { useState, useEffect } from "react";
import { Screen, Settings, GameStats, DEF_SETTINGS, DEF_STATS } from "@/types/game";
import { MenuScreen, SettingsScreen, RatingScreen, StatsScreen, RulesScreen } from "@/components/game/GameScreens";
import { GameBoard } from "@/components/game/GameBoard";
import { GameBoardTwoPlayer } from "@/components/game/GameBoardTwoPlayer";

function load<T>(key: string, fallback: T): T {
  try { const d = localStorage.getItem(key); return d ? JSON.parse(d) : fallback; }
  catch { return fallback; }
}

export default function Index() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [settings, setSettings] = useState<Settings>(() => load("cks_settings", DEF_SETTINGS));
  const [stats, setStats] = useState<GameStats>(() => load("cks_stats", DEF_STATS));

  useEffect(() => { localStorage.setItem("cks_settings", JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem("cks_stats", JSON.stringify(stats)); }, [stats]);

  const updateSettings = (p: Partial<Settings>) => setSettings(prev => ({ ...prev, ...p }));

  const handleGameEnd = (result: "win" | "loss" | "draw") => {
    setStats(prev => {
      const wins = prev.wins + (result === "win" ? 1 : 0);
      const losses = prev.losses + (result === "loss" ? 1 : 0);
      const draws = prev.draws + (result === "draw" ? 1 : 0);
      const gamesPlayed = prev.gamesPlayed + 1;
      const currentStreak = result === "win" ? prev.currentStreak + 1 : 0;
      const bestWinStreak = Math.max(prev.bestWinStreak, currentStreak);
      return { ...prev, wins, losses, draws, gamesPlayed, currentStreak, bestWinStreak };
    });
  };

  return (
    <div className="min-h-screen max-w-md mx-auto relative overflow-hidden" style={{ fontFamily: "'Rubik', sans-serif" }}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-orange-500/5 blur-3xl animate-float" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-blue-500/5 blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
      </div>

      {screen === "menu" && <MenuScreen onNav={setScreen} stats={stats} />}
      {screen === "game" && <GameBoard settings={settings} onNav={setScreen} onGameEnd={handleGameEnd} />}
      {screen === "game2p" && <GameBoardTwoPlayer onNav={setScreen} />}
      {screen === "settings" && <SettingsScreen settings={settings} onUpdate={updateSettings} onBack={() => setScreen("menu")} />}
      {screen === "rating" && <RatingScreen onBack={() => setScreen("menu")} stats={stats} />}
      {screen === "stats" && <StatsScreen stats={stats} onBack={() => setScreen("menu")} />}
      {screen === "rules" && <RulesScreen onBack={() => setScreen("menu")} />}
    </div>
  );
}