import { ACCENT, ACCENT_GRADIENT, HABIT_COLORS } from "../theme";
import { haptic, notifySuccess } from "../telegram";
import { type Habit } from "../data";
import { useStore } from "../store/store";
import {
  scheduledHabits,
  isDoneOn,
  progressOn,
  progressTextOn,
  streakOn,
} from "../store/selectors";
import { todayISO, formatWeekdayFull, formatDayMonth } from "../date";
import { HABIT_ICONS } from "../habitMeta";
import { Header } from "../components/Header";
import { DaySelector } from "../components/DaySelector";
import { Check, CheckSquare, Star, Flame, ChevronDown, Plus } from "../icons";

interface CardView {
  h: Habit;
  done: boolean;
  progress: number;
  progressText: string;
  streak: number;
  onTap: (id: string) => void;
  onOpen: (id: string) => void;
}

function HabitCard({ h, done, progress, progressText, streak, onTap, onOpen }: CardView) {
  const pal = HABIT_COLORS[h.color] ?? HABIT_COLORS.coral;
  const Icon = HABIT_ICONS[h.icon] ?? CheckSquare;
  const pct = Math.round(progress * 100);
  return (
    <div
      onClick={() => onTap(h.id)}
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 18,
        background: pal.light.track,
        cursor: "pointer",
        minHeight: 76,
        display: "flex",
        alignItems: "center",
        padding: "14px 15px",
        gap: 13,
        boxShadow: "0 1px 2px rgba(60,40,30,.05)",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: `${pct}%`,
          background: pal.light.fill,
          transition: "width .55s cubic-bezier(.34,1.2,.5,1)",
        }}
      />
      <div
        onClick={(e) => {
          e.stopPropagation();
          haptic("light");
          onOpen(h.id);
        }}
        style={{
          position: "relative",
          width: 44,
          height: 44,
          borderRadius: 13,
          background: "var(--chip)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "none",
          color: "var(--text)",
        }}
      >
        <Icon size={22} stroke={2} />
      </div>
      <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: "var(--text)", lineHeight: 1.15 }}>
          {h.name}
        </div>
        <div
          style={{
            fontWeight: 800,
            fontSize: 13,
            color: "var(--text)",
            opacity: 0.6,
            marginTop: 3,
          }}
        >
          {progressText}
        </div>
      </div>
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 7,
          flex: "none",
        }}
      >
        {streak > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 3,
              background: "rgba(255,255,255,.7)",
              borderRadius: 999,
              padding: "3px 8px 3px 6px",
              fontWeight: 900,
              fontSize: 12,
              color: "#C2410C",
            }}
          >
            <Flame size={13} color="#F2994A" fill="#F2994A" stroke={1.5} />
            {streak}
          </div>
        )}
        {done && (
          <div
            style={{
              width: 27,
              height: 27,
              borderRadius: 999,
              background: "var(--text)",
              color: "var(--bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "pop .35s ease",
            }}
          >
            <Check size={15} color="var(--bg)" stroke={3} />
          </div>
        )}
      </div>
    </div>
  );
}

export function Today({
  onEdit,
  onTimer,
}: {
  onEdit: (id: string | null) => void;
  onTimer: (id: string) => void;
}) {
  const { state, dispatch } = useStore();
  const date = state.selectedDate;
  const isToday = date === todayISO();
  const habits = scheduledHabits(state.habits, date);

  const tap = (id: string) => {
    const habit = state.habits.find((h) => h.id === id)!;
    // Time habits open the concentration timer instead of toggling.
    if (habit.type === "time") {
      haptic("light");
      onTimer(id);
      return;
    }
    const wasDone = isDoneOn(state.entries, habit, date);
    if (wasDone) haptic("light");
    else notifySuccess();
    dispatch({ type: "tap_habit", id, date });
  };

  const doneCount = habits.filter((h) => isDoneOn(state.entries, h, date)).length;
  const allDone = habits.length > 0 && doneCount === habits.length;
  const pct = habits.length ? Math.round((doneCount / habits.length) * 100) : 0;

  return (
    <div className="screen-pad">
      <Header
        eyebrow={formatWeekdayFull(date) + ", " + formatDayMonth(date)}
        title={isToday ? "Сегодня" : formatDayMonth(date)}
        right={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: "var(--card)",
                border: "1px solid var(--line)",
                borderRadius: 999,
                padding: "8px 12px",
                fontWeight: 800,
                fontSize: 13,
                color: "var(--text)",
                cursor: "pointer",
              }}
            >
              Все <ChevronDown size={15} />
            </button>
            <button
              onClick={() => {
                haptic("light");
                onEdit(null);
              }}
              title="Добавить привычку"
              style={{
                width: 40,
                height: 40,
                border: "none",
                borderRadius: 999,
                background: ACCENT,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 6px 16px -6px rgba(242,107,122,.8)",
              }}
            >
              <Plus size={20} color="#fff" />
            </button>
          </div>
        }
      />

      <DaySelector />

      {allDone && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 13,
            background: ACCENT_GRADIENT,
            borderRadius: 20,
            padding: "16px 18px",
            marginBottom: 14,
            boxShadow: "0 8px 22px -8px rgba(242,107,122,.6)",
            animation: "fadeup .4s ease",
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 999,
              background: "rgba(255,255,255,.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              flex: "none",
            }}
          >
            <Star size={22} color="#fff" fill="#fff" stroke={1.5} />
          </div>
          <div style={{ color: "#fff" }}>
            <div style={{ fontSize: 18, fontWeight: 900, lineHeight: 1.1 }}>Идеальный день!</div>
            <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.9, marginTop: 2 }}>
              Все привычки выполнены
            </div>
          </div>
        </div>
      )}

      {!allDone && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--hint)" }}>
            Выполнено {doneCount} из {habits.length}
          </div>
          <div
            style={{
              width: 120,
              height: 6,
              borderRadius: 999,
              background: "var(--card2)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${pct}%`,
                background: ACCENT,
                borderRadius: 999,
                transition: "width .5s ease",
              }}
            />
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {habits.map((h) => (
          <HabitCard
            key={h.id}
            h={h}
            done={isDoneOn(state.entries, h, date)}
            progress={progressOn(state.entries, h, date)}
            progressText={progressTextOn(state.entries, h, date)}
            streak={streakOn(state.entries, h, date)}
            onTap={tap}
            onOpen={onEdit}
          />
        ))}
      </div>

      {habits.length === 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            padding: "54px 24px",
          }}
        >
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: 26,
              background: "var(--card2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--hint)",
              marginBottom: 18,
            }}
          >
            <CheckSquare size={34} />
          </div>
          <div style={{ fontSize: 19, fontWeight: 900, color: "var(--text)" }}>
            {state.habits.length === 0 ? "Пока нет привычек" : "На этот день привычек нет"}
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "var(--hint)",
              marginTop: 6,
              maxWidth: 230,
              lineHeight: 1.4,
            }}
          >
            {state.habits.length === 0
              ? "Добавьте первую привычку и начните свой стрик уже сегодня"
              : "Привычки запланированы на другие дни недели"}
          </div>
          {state.habits.length === 0 && (
            <button
              onClick={() => {
                haptic("light");
                onEdit(null);
              }}
              style={{
                marginTop: 22,
                background: ACCENT,
                color: "#fff",
                border: "none",
                borderRadius: 999,
                padding: "14px 26px",
                fontWeight: 900,
                fontSize: 15,
                cursor: "pointer",
                boxShadow: "0 8px 20px -8px rgba(242,107,122,.7)",
              }}
            >
              Добавить привычку
            </button>
          )}
        </div>
      )}
    </div>
  );
}
