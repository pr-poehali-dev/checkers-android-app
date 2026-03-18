import Icon from "@/components/ui/icon";
import { Screen, GameStats, Settings, Difficulty, PieceColor, DIFFICULTY_LABELS, RATING_DATA } from "@/types/game";

type IconName = string;

// ─── MenuScreen ───────────────────────────────────────────────────────────────
export function MenuScreen({ onNav, stats }: { onNav: (s: Screen) => void; stats: GameStats }) {
  return (
    <div className="flex flex-col items-center justify-between min-h-screen px-6 py-10 animate-fade-in">
      <div className="text-center pt-8">
        <div className="text-7xl animate-float mb-3">♟</div>
        <h1 className="font-montserrat font-black text-5xl text-gradient mb-1 tracking-tight">ШАШКИ</h1>
        <p className="text-muted-foreground font-rubik text-xs tracking-widest uppercase">Классическая игра</p>
      </div>

      <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
        {[
          { label: "Побед", value: stats.wins, icon: "Trophy" },
          { label: "Игр", value: stats.gamesPlayed, icon: "Gamepad2" },
          { label: "Серия", value: stats.currentStreak, icon: "Zap" },
        ].map(s => (
          <div key={s.label} className="glass rounded-2xl p-3 text-center">
            <Icon name={s.icon as IconName} size={18} className="mx-auto mb-1 text-orange-400" />
            <div className="font-montserrat font-bold text-xl text-white">{s.value}</div>
            <div className="font-rubik text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 w-full max-w-sm">
        <button className="btn-primary text-lg" onClick={() => onNav("game")}>
          Новая игра
        </button>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Настройки", icon: "Settings", screen: "settings" as Screen },
            { label: "Рейтинг", icon: "Crown", screen: "rating" as Screen },
            { label: "Статистика", icon: "BarChart2", screen: "stats" as Screen },
            { label: "Правила", icon: "BookOpen", screen: "rules" as Screen },
          ].map(btn => (
            <button
              key={btn.label}
              className="btn-secondary text-sm flex items-center justify-center gap-2"
              onClick={() => onNav(btn.screen)}
            >
              <Icon name={btn.icon as IconName} size={16} className="text-orange-400" />
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-muted-foreground text-xs font-rubik">v1.0 · Шашки Pro</p>
    </div>
  );
}

// ─── SettingsScreen ───────────────────────────────────────────────────────────
export function SettingsScreen({ settings, onUpdate, onBack }: {
  settings: Settings;
  onUpdate: (s: Partial<Settings>) => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col min-h-screen px-5 py-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={onBack} className="glass rounded-xl p-2 text-muted-foreground hover:text-white transition-colors">
          <Icon name="ChevronLeft" size={22} />
        </button>
        <h1 className="font-montserrat font-black text-2xl text-gradient">Настройки</h1>
      </div>

      <div className="space-y-4">
        {/* Difficulty */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="Sword" size={18} className="text-orange-400" />
            <span className="font-montserrat font-bold text-white">Сложность</span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {(["beginner","easy","medium","hard","master"] as Difficulty[]).map(d => (
              <button
                key={d}
                onClick={() => onUpdate({ difficulty: d })}
                className={`rounded-xl py-2 px-1 text-xs font-montserrat font-semibold transition-all duration-200
                  ${settings.difficulty === d ? "bg-orange-500 text-gray-900 scale-105" : "glass text-muted-foreground hover:text-white"}`}
              >
                {DIFFICULTY_LABELS[d].slice(0, 4)}
              </button>
            ))}
          </div>
          <p className="text-muted-foreground text-xs mt-3 text-center">
            Выбрано: <span className="text-orange-400 font-semibold">{DIFFICULTY_LABELS[settings.difficulty]}</span>
          </p>
        </div>

        {/* Color */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="Palette" size={18} className="text-orange-400" />
            <span className="font-montserrat font-bold text-white">Цвет фигур</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(["white","black"] as PieceColor[]).map(color => (
              <button
                key={color}
                onClick={() => onUpdate({ playerColor: color })}
                className={`rounded-xl p-3 flex items-center gap-3 transition-all duration-200
                  ${settings.playerColor === color ? "bg-orange-500/20 border border-orange-500" : "glass"}`}
              >
                <div className={`w-8 h-8 rounded-full border-2
                  ${color === "white" ? "bg-amber-100 border-amber-400" : "bg-gray-900 border-gray-600"}`} />
                <span className="font-montserrat font-semibold text-sm text-white">
                  {color === "white" ? "Белые" : "Чёрные"}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="glass rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Icon name="Sliders" size={18} className="text-orange-400" />
            <span className="font-montserrat font-bold text-white">Параметры</span>
          </div>
          {[
            { key: "showHints" as keyof Settings, label: "Подсказки ходов", icon: "Lightbulb" },
            { key: "animationsEnabled" as keyof Settings, label: "Анимации", icon: "Sparkles" },
            { key: "soundEnabled" as keyof Settings, label: "Звуки", icon: "Volume2" },
          ].map(opt => (
            <div key={opt.key} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name={opt.icon as IconName} size={16} className="text-muted-foreground" />
                <span className="font-rubik text-sm text-white">{opt.label}</span>
              </div>
              <button
                onClick={() => onUpdate({ [opt.key]: !settings[opt.key] })}
                className={`w-12 h-6 rounded-full transition-all duration-300 relative ${settings[opt.key] ? "bg-orange-500" : "bg-gray-700"}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all duration-300 shadow-sm ${settings[opt.key] ? "left-6" : "left-0.5"}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── RatingScreen ─────────────────────────────────────────────────────────────
export function RatingScreen({ onBack, stats }: { onBack: () => void; stats: GameStats }) {
  const playerScore = Math.max(0, stats.wins * 100 - stats.losses * 30);
  const allEntries = [...RATING_DATA, { name: "Вы", score: playerScore, wins: stats.wins, difficulty: "—", avatar: "🎮" }]
    .sort((a, b) => b.score - a.score);

  return (
    <div className="flex flex-col min-h-screen px-5 py-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="glass rounded-xl p-2 text-muted-foreground hover:text-white transition-colors">
          <Icon name="ChevronLeft" size={22} />
        </button>
        <h1 className="font-montserrat font-black text-2xl text-gradient">Рейтинг</h1>
      </div>

      <div className="glass-strong rounded-2xl p-4 mb-4 flex items-center gap-4 glow-orange">
        <div className="text-4xl">🎮</div>
        <div className="flex-1">
          <div className="font-montserrat font-black text-base text-white">Вы</div>
          <div className="text-muted-foreground text-sm">{stats.wins} побед · {stats.gamesPlayed} игр</div>
        </div>
        <div className="text-right">
          <div className="font-montserrat font-black text-2xl text-gradient">{playerScore}</div>
          <div className="text-muted-foreground text-xs">очков</div>
        </div>
      </div>

      <div className="space-y-2 flex-1 overflow-y-auto pb-4">
        {allEntries.map((entry, i) => {
          const isMe = entry.name === "Вы";
          return (
            <div key={entry.name} className={`rounded-2xl p-3 flex items-center gap-3 ${isMe ? "bg-orange-500/20 border border-orange-500/40" : "glass"}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-montserrat font-black text-xs flex-shrink-0
                ${i === 0 ? "bg-yellow-400 text-gray-900" : i === 1 ? "bg-gray-300 text-gray-900" : i === 2 ? "bg-amber-600 text-white" : "bg-gray-700 text-gray-300"}`}>
                {i + 1}
              </div>
              <div className="text-xl">{entry.avatar}</div>
              <div className="flex-1 min-w-0">
                <div className={`font-montserrat font-bold text-sm truncate ${isMe ? "text-orange-400" : "text-white"}`}>{entry.name}</div>
                <div className="text-muted-foreground text-xs">{entry.wins} побед · {entry.difficulty}</div>
              </div>
              <div className="font-montserrat font-black text-base text-white flex-shrink-0">{entry.score}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── StatsScreen ──────────────────────────────────────────────────────────────
export function StatsScreen({ stats, onBack }: { stats: GameStats; onBack: () => void }) {
  const winRate = stats.gamesPlayed > 0 ? Math.round((stats.wins / stats.gamesPlayed) * 100) : 0;
  return (
    <div className="flex flex-col min-h-screen px-5 py-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="glass rounded-xl p-2 text-muted-foreground hover:text-white transition-colors">
          <Icon name="ChevronLeft" size={22} />
        </button>
        <h1 className="font-montserrat font-black text-2xl text-gradient">Статистика</h1>
      </div>

      <div className="glass-strong rounded-3xl p-6 mb-5 flex items-center gap-6">
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(230 15% 18%)" strokeWidth="8" />
            <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(25 95% 60%)" strokeWidth="8"
              strokeDasharray={`${winRate * 2.51} 251`} strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-montserrat font-black text-xl text-white">{winRate}%</span>
          </div>
        </div>
        <div>
          <div className="font-montserrat font-black text-lg text-white">Процент побед</div>
          <div className="text-muted-foreground text-sm mt-1">{stats.wins}П / {stats.losses}Пор / {stats.draws}Н</div>
          {stats.gamesPlayed === 0 && <p className="text-muted-foreground text-xs mt-2">Сыграйте первую игру!</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Побед", value: stats.wins, icon: "Trophy", color: "text-yellow-400" },
          { label: "Поражений", value: stats.losses, icon: "X", color: "text-red-400" },
          { label: "Ничьих", value: stats.draws, icon: "Minus", color: "text-blue-400" },
          { label: "Всего игр", value: stats.gamesPlayed, icon: "Gamepad2", color: "text-orange-400" },
          { label: "Лучшая серия", value: stats.bestWinStreak, icon: "Flame", color: "text-orange-500" },
          { label: "Тек. серия", value: stats.currentStreak, icon: "Zap", color: "text-green-400" },
        ].map(item => (
          <div key={item.label} className="glass rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center flex-shrink-0">
              <Icon name={item.icon as IconName} size={20} className={item.color} />
            </div>
            <div>
              <div className="font-montserrat font-black text-xl text-white">{item.value}</div>
              <div className="text-muted-foreground text-xs">{item.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── RulesScreen ──────────────────────────────────────────────────────────────
export function RulesScreen({ onBack }: { onBack: () => void }) {
  const rules = [
    { title: "Начало игры", icon: "PlayCircle", text: "Каждый игрок начинает с 12 шашками на тёмных клетках трёх первых рядов. Белые ходят первыми." },
    { title: "Ход шашки", icon: "ArrowUpRight", text: "Обычная шашка ходит по диагонали вперёд на одну клетку." },
    { title: "Взятие", icon: "Crosshair", text: "Если вражеская шашка стоит по диагонали, а следующая клетка свободна — нужно перепрыгнуть и снять её. Взятие обязательно!" },
    { title: "Дамка", icon: "Crown", text: "Шашка, достигшая последнего ряда соперника, становится дамкой. Дамка ходит на любое расстояние по диагонали в любом направлении." },
    { title: "Серия взятий", icon: "Zap", text: "Если после взятия можно прыгнуть ещё — это обязательно. За один ход можно снять несколько шашек." },
    { title: "Победа", icon: "Trophy", text: "Побеждает тот, кто снимет все шашки соперника или лишит его возможности ходить." },
  ];
  return (
    <div className="flex flex-col min-h-screen px-5 py-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="glass rounded-xl p-2 text-muted-foreground hover:text-white transition-colors">
          <Icon name="ChevronLeft" size={22} />
        </button>
        <h1 className="font-montserrat font-black text-2xl text-gradient">Правила</h1>
      </div>
      <div className="space-y-3 flex-1">
        {rules.map((r, i) => (
          <div key={r.title} className="glass rounded-2xl p-4 flex gap-3" style={{ animationDelay: `${i*60}ms` }}>
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Icon name={r.icon as IconName} size={18} className="text-orange-400" />
            </div>
            <div>
              <h3 className="font-montserrat font-bold text-white text-sm mb-1">{r.title}</h3>
              <p className="font-rubik text-muted-foreground text-sm leading-relaxed">{r.text}</p>
            </div>
          </div>
        ))}
        <div className="glass-strong rounded-2xl p-5 text-center">
          <div className="text-3xl mb-2">🇷🇺</div>
          <h3 className="font-montserrat font-bold text-white mb-1">Русские шашки</h3>
          <p className="text-muted-foreground text-sm font-rubik">Классические правила на доске 8×8</p>
        </div>
      </div>
    </div>
  );
}
