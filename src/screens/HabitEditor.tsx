import { useEffect, useRef, useState } from "react";
import { ACCENT, HABIT_COLORS } from "../theme";
import type { Habit } from "../data";
import { useStore, newId } from "../store/store";
import {
  HABIT_ICONS,
  ICON_KEYS,
  COLOR_KEYS,
  TYPE_OPTIONS,
  UNIT_OPTIONS,
  DAY_LABELS,
  draftHabit,
} from "../habitMeta";
import {
  hasTelegram,
  haptic,
  notifySuccess,
  showMainButton,
  hideMainButton,
  setMainButtonEnabled,
  showBackButton,
  hideBackButton,
} from "../telegram";
import { ChevronLeft, Bell, Trash } from "../icons";

const label: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
  color: "var(--hint)",
  marginBottom: 10,
};

export function HabitEditor({
  habitId,
  onClose,
}: {
  habitId: string | null; // null = create new
  onClose: () => void;
}) {
  const { state, dispatch } = useStore();
  const existing = habitId ? state.habits.find((h) => h.id === habitId) : undefined;
  const isEditing = !!existing;

  const [draft, setDraft] = useState<Habit>(existing ?? draftHabit(newId()));
  const set = (patch: Partial<Habit>) => setDraft((d) => ({ ...d, ...patch }));

  const save = () => {
    const name = draft.name.trim();
    if (!name) {
      haptic("medium");
      return;
    }
    const next: Habit = { ...draft, name };
    dispatch(isEditing ? { type: "update_habit", habit: next } : { type: "add_habit", habit: next });
    notifySuccess();
    onClose();
  };

  const remove = () => {
    if (!existing) return;
    haptic("medium");
    dispatch({ type: "delete_habit", id: existing.id });
    onClose();
  };

  // Telegram MainButton + BackButton drive save/close.
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    showMainButton("Сохранить", () => saveRef.current());
    showBackButton(onClose);
    return () => {
      hideMainButton();
      hideBackButton();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    setMainButtonEnabled(draft.name.trim().length > 0);
  }, [draft.name]);

  const pal = HABIT_COLORS[draft.color] ?? HABIT_COLORS.coral;
  const BigIcon = HABIT_ICONS[draft.icon];
  const showTarget = draft.type !== "check";

  return (
    <div className="app">
      <div className="screen noscroll" style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "14px 16px 0", flex: 1, display: "flex", flexDirection: "column" }}>
          {/* header */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <button
              onClick={onClose}
              style={{
                width: 36,
                height: 36,
                border: "none",
                borderRadius: 12,
                background: "var(--card2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "var(--text)",
              }}
            >
              <ChevronLeft size={18} />
            </button>
            <div style={{ fontSize: 19, fontWeight: 900, color: "var(--text)" }}>
              {isEditing ? "Редактировать" : "Новая привычка"}
            </div>
          </div>

          {/* icon + name */}
          <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 22 }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 18,
                background: pal.light.track,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text)",
                flex: "none",
              }}
            >
              <BigIcon size={28} />
            </div>
            <input
              value={draft.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="Название привычки"
              style={{
                flex: 1,
                minWidth: 0,
                border: "none",
                borderBottom: "2px solid var(--line)",
                background: "transparent",
                fontWeight: 800,
                fontSize: 19,
                color: "var(--text)",
                padding: "8px 2px",
                outline: "none",
              }}
            />
          </div>

          {/* icon picker */}
          <div style={label}>Иконка</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(8,1fr)",
              gap: 8,
              marginBottom: 22,
            }}
          >
            {ICON_KEYS.map((key) => {
              const Icon = HABIT_ICONS[key];
              const active = draft.icon === key;
              return (
                <div
                  key={key}
                  onClick={() => {
                    haptic("light");
                    set({ icon: key });
                  }}
                  style={{
                    aspectRatio: "1",
                    borderRadius: 13,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    background: active ? pal.light.track : "var(--card2)",
                    color: active ? "var(--text)" : "var(--hint)",
                    border: `2px solid ${active ? pal.solid : "transparent"}`,
                  }}
                >
                  <Icon size={20} />
                </div>
              );
            })}
          </div>

          {/* color picker */}
          <div style={label}>Цвет</div>
          <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
            {COLOR_KEYS.map((key) => {
              const active = draft.color === key;
              return (
                <div
                  key={key}
                  onClick={() => {
                    haptic("light");
                    set({ color: key });
                  }}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 999,
                    cursor: "pointer",
                    background: HABIT_COLORS[key].solid,
                    boxShadow: active ? `0 0 0 3px var(--bg), 0 0 0 5px ${HABIT_COLORS[key].solid}` : "none",
                  }}
                />
              );
            })}
          </div>

          {/* type segmented */}
          <div style={label}>Тип цели</div>
          <div
            style={{
              display: "flex",
              gap: 6,
              background: "var(--card2)",
              borderRadius: 14,
              padding: 4,
              marginBottom: 22,
            }}
          >
            {TYPE_OPTIONS.map((o) => {
              const active = draft.type === o.key;
              return (
                <button
                  key={o.key}
                  onClick={() => {
                    haptic("light");
                    set({ type: o.key });
                  }}
                  style={{
                    flex: 1,
                    border: "none",
                    borderRadius: 11,
                    padding: "11px 0",
                    fontWeight: 800,
                    fontSize: 14,
                    cursor: "pointer",
                    background: active ? "var(--card)" : "transparent",
                    color: active ? "var(--text)" : "var(--hint)",
                    boxShadow: active ? "0 1px 3px rgba(0,0,0,.12)" : "none",
                  }}
                >
                  {o.label}
                </button>
              );
            })}
          </div>

          {/* target */}
          {showTarget && (
            <>
              <div style={label}>Цель</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <button
                  onClick={() => set({ target: Math.max(1, (draft.target ?? 1) - 1) })}
                  style={stepBtn}
                >
                  −
                </button>
                <div
                  className="bignum"
                  style={{ flex: 1, textAlign: "center", fontSize: 26, fontWeight: 900, color: "var(--text)" }}
                >
                  {draft.target ?? 1}
                </div>
                <button onClick={() => set({ target: (draft.target ?? 1) + 1 })} style={stepBtn}>
                  +
                </button>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 22 }}>
                {UNIT_OPTIONS.map((u) => {
                  const active = draft.unit === u;
                  return (
                    <button
                      key={u}
                      onClick={() => set({ unit: u })}
                      style={{
                        border: `1px solid ${active ? ACCENT : "var(--line)"}`,
                        borderRadius: 999,
                        padding: "7px 14px",
                        fontWeight: 800,
                        fontSize: 13,
                        cursor: "pointer",
                        background: active ? "rgba(242,107,122,.12)" : "transparent",
                        color: active ? ACCENT : "var(--text)",
                      }}
                    >
                      {u}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* weekdays */}
          <div style={label}>Дни недели</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 22 }}>
            {DAY_LABELS.map((lbl, i) => {
              const active = draft.days.includes(i);
              return (
                <button
                  key={i}
                  onClick={() => {
                    haptic("light");
                    set({
                      days: active ? draft.days.filter((d) => d !== i) : [...draft.days, i].sort(),
                    });
                  }}
                  style={{
                    flex: 1,
                    aspectRatio: "1",
                    border: "none",
                    borderRadius: 13,
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: "pointer",
                    background: active ? ACCENT : "var(--card2)",
                    color: active ? "#fff" : "var(--hint)",
                  }}
                >
                  {lbl}
                </button>
              );
            })}
          </div>

          {/* reminder */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "var(--card)",
              borderRadius: 16,
              padding: "14px 16px",
              marginBottom: 18,
              boxShadow: "0 1px 2px rgba(60,40,30,.05)",
            }}
          >
            <div style={{ color: "var(--hint)" }}>
              <Bell size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}>Напоминание</div>
              {draft.reminderOn && (
                <input
                  type="time"
                  value={draft.reminderTime ?? "09:00"}
                  onChange={(e) => set({ reminderTime: e.target.value })}
                  style={{
                    border: "none",
                    background: "transparent",
                    fontWeight: 800,
                    fontSize: 13,
                    color: ACCENT,
                    padding: 0,
                    marginTop: 2,
                    outline: "none",
                  }}
                />
              )}
            </div>
            <div
              onClick={() => {
                haptic("light");
                set({ reminderOn: !draft.reminderOn });
              }}
              style={{
                width: 46,
                height: 28,
                borderRadius: 999,
                background: draft.reminderOn ? ACCENT : "var(--line)",
                position: "relative",
                cursor: "pointer",
                transition: "background .2s",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 3,
                  left: draft.reminderOn ? 21 : 3,
                  width: 22,
                  height: 22,
                  borderRadius: 999,
                  background: "#fff",
                  boxShadow: "0 1px 3px rgba(0,0,0,.2)",
                  transition: "left .2s",
                }}
              />
            </div>
          </div>

          {isEditing && (
            <button
              onClick={remove}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                width: "100%",
                border: "none",
                background: "transparent",
                color: "#E0556A",
                fontWeight: 800,
                fontSize: 14,
                cursor: "pointer",
                padding: 6,
                marginBottom: 14,
              }}
            >
              <Trash size={18} color="#E0556A" />
              Удалить привычку
            </button>
          )}

          {/* In-page save button — only when not inside Telegram (no MainButton). */}
          {!hasTelegram && (
            <div
              style={{
                position: "sticky",
                bottom: 0,
                padding: "10px 0 16px",
                background: "linear-gradient(to top,var(--bg) 70%,transparent)",
                marginTop: "auto",
              }}
            >
              <button
                onClick={save}
                disabled={!draft.name.trim()}
                style={{
                  width: "100%",
                  border: "none",
                  borderRadius: 16,
                  background: ACCENT,
                  color: "#fff",
                  fontWeight: 900,
                  fontSize: 16,
                  padding: 15,
                  cursor: draft.name.trim() ? "pointer" : "not-allowed",
                  opacity: draft.name.trim() ? 1 : 0.5,
                  boxShadow: "0 8px 20px -8px rgba(242,107,122,.7)",
                }}
              >
                Сохранить
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const stepBtn: React.CSSProperties = {
  width: 44,
  height: 44,
  border: "none",
  borderRadius: 13,
  background: "var(--card2)",
  fontSize: 24,
  fontWeight: 800,
  color: "var(--text)",
  cursor: "pointer",
};
