import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from "react";
import {
  HABITS,
  ACTIVITIES,
  FOODS,
  ENTRIES,
  type Habit,
  type ActivityRow,
  type FoodRow,
  type EntryLog,
} from "../data";
import { todayISO } from "../date";
import { nextTapValue, valueOn } from "./selectors";
import { loadState, saveState } from "./storage";

export interface AppState {
  habits: Habit[];
  activities: ActivityRow[];
  foods: FoodRow[];
  entries: EntryLog;
  selectedDate: string; // ISO; the "current" calendar day in the UI
}

const initialState: AppState = {
  habits: HABITS,
  activities: ACTIVITIES,
  foods: FOODS,
  entries: ENTRIES,
  selectedDate: todayISO(),
};

export type Action =
  | { type: "tap_habit"; id: string; date: string }
  | { type: "set_habit_value"; id: string; date: string; value: number }
  | { type: "select_date"; date: string }
  | { type: "add_habit"; habit: Habit }
  | { type: "update_habit"; habit: Habit }
  | { type: "delete_habit"; id: string }
  | { type: "delete_activity"; id: string }
  | { type: "delete_food"; id: string };

function setEntry(entries: EntryLog, id: string, date: string, value: number): EntryLog {
  const forHabit = { ...(entries[id] ?? {}) };
  if (value <= 0) delete forHabit[date];
  else forHabit[date] = value;
  return { ...entries, [id]: forHabit };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "tap_habit": {
      const h = state.habits.find((x) => x.id === action.id);
      if (!h) return state;
      const cur = valueOn(state.entries, h.id, action.date);
      return { ...state, entries: setEntry(state.entries, h.id, action.date, nextTapValue(h, cur)) };
    }
    case "set_habit_value":
      return {
        ...state,
        entries: setEntry(state.entries, action.id, action.date, Math.max(0, action.value)),
      };
    case "select_date":
      return { ...state, selectedDate: action.date };
    case "add_habit":
      return { ...state, habits: [...state.habits, action.habit] };
    case "update_habit":
      return {
        ...state,
        habits: state.habits.map((h) => (h.id === action.habit.id ? action.habit : h)),
      };
    case "delete_habit": {
      const entries = { ...state.entries };
      delete entries[action.id];
      return { ...state, habits: state.habits.filter((h) => h.id !== action.id), entries };
    }
    case "delete_activity":
      return { ...state, activities: state.activities.filter((a) => a.id !== action.id) };
    case "delete_food":
      return { ...state, foods: state.foods.filter((f) => f.id !== action.id) };
    default:
      return state;
  }
}

interface Store {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState, (init) => ({
    ...loadState(init),
    selectedDate: todayISO(), // always open on the current day
  }));

  useEffect(() => {
    saveState(state);
  }, [state]);

  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used within <StoreProvider>");
  return ctx;
}

export function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
