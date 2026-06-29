import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from "react";
import {
  HABITS,
  ACTIVITY_TYPES,
  ACTIVITIES,
  PRODUCTS,
  FOODS,
  ENTRIES,
  type Habit,
  type ActivityType,
  type ActivityRow,
  type Product,
  type FoodEntry,
  type EntryLog,
  type BreakLog,
  type Profile,
  type TimerSession,
} from "../data";
import { todayISO } from "../date";
import { nextTapValue, valueOn, isBreak, canCancelBreak } from "./selectors";
import { loadRaw, saveRaw } from "./storage";
import { migrate } from "./migrate";
import { canSync, fetchRemote, pushRemote } from "./sync";

export interface AppState {
  habits: Habit[];
  activityTypes: ActivityType[]; // activity library
  activities: ActivityRow[]; // diary entries
  products: Product[]; // product/dish database
  foods: FoodEntry[]; // diary meals
  entries: EntryLog;
  breaks: BreakLog; // excused day -> day it was placed ("каникулы")
  selectedDate: string; // ISO; the "current" calendar day in the UI
  apiKey?: string; // Anthropic key for AI lookup (device-local, not synced)
  profile: Profile; // user data (age, weight, height, sex, …)
  timer: TimerSession | null; // active/resumable timer
  schemaVersion?: number; // migration marker
}

const initialState: AppState = {
  habits: HABITS,
  activityTypes: ACTIVITY_TYPES,
  activities: ACTIVITIES,
  products: PRODUCTS,
  foods: FOODS,
  entries: ENTRIES,
  breaks: {},
  selectedDate: todayISO(),
  profile: {},
  timer: null,
};

export type Action =
  | { type: "tap_habit"; id: string; date: string }
  | { type: "set_habit_value"; id: string; date: string; value: number }
  | { type: "toggle_break"; date: string }
  | { type: "select_date"; date: string }
  | { type: "add_habit"; habit: Habit }
  | { type: "update_habit"; habit: Habit }
  | { type: "delete_habit"; id: string }
  | { type: "add_activity"; row: ActivityRow }
  | { type: "update_activity"; row: ActivityRow }
  | { type: "delete_activity"; id: string }
  | { type: "add_activity_type"; activityType: ActivityType }
  | { type: "update_activity_type"; activityType: ActivityType }
  | { type: "delete_activity_type"; id: string }
  | { type: "add_food"; row: FoodEntry }
  | { type: "update_food"; row: FoodEntry }
  | { type: "delete_food"; id: string }
  | { type: "add_product"; product: Product }
  | { type: "update_product"; product: Product }
  | { type: "delete_product"; id: string }
  | { type: "set_api_key"; apiKey: string }
  | { type: "update_profile"; patch: Partial<Profile> }
  | { type: "set_timer"; timer: TimerSession | null }
  | { type: "hydrate"; state: AppState };

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
    case "toggle_break": {
      const today = todayISO();
      if (isBreak(state.breaks, action.date)) {
        // Undo is only allowed on the day the break was placed.
        if (!canCancelBreak(state.breaks, action.date, today)) return state;
        const breaks = { ...state.breaks };
        delete breaks[action.date];
        return { ...state, breaks };
      }
      return { ...state, breaks: { ...state.breaks, [action.date]: today } };
    }
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
    case "add_activity":
      return { ...state, activities: [...state.activities, action.row] };
    case "update_activity":
      return {
        ...state,
        activities: state.activities.map((a) => (a.id === action.row.id ? action.row : a)),
      };
    case "delete_activity":
      return { ...state, activities: state.activities.filter((a) => a.id !== action.id) };
    case "add_activity_type":
      return { ...state, activityTypes: [...state.activityTypes, action.activityType] };
    case "update_activity_type":
      return {
        ...state,
        activityTypes: state.activityTypes.map((a) =>
          a.id === action.activityType.id ? action.activityType : a
        ),
      };
    case "delete_activity_type":
      return {
        ...state,
        activityTypes: state.activityTypes.filter((a) => a.id !== action.id),
      };
    case "add_food":
      return { ...state, foods: [...state.foods, action.row] };
    case "update_food":
      return {
        ...state,
        foods: state.foods.map((f) => (f.id === action.row.id ? action.row : f)),
      };
    case "delete_food":
      return { ...state, foods: state.foods.filter((f) => f.id !== action.id) };
    case "add_product":
      return { ...state, products: [...state.products, action.product] };
    case "update_product":
      return {
        ...state,
        products: state.products.map((p) => (p.id === action.product.id ? action.product : p)),
      };
    case "delete_product":
      return { ...state, products: state.products.filter((p) => p.id !== action.id) };
    case "set_api_key":
      return { ...state, apiKey: action.apiKey };
    case "update_profile":
      return { ...state, profile: { ...state.profile, ...action.patch } };
    case "set_timer":
      return { ...state, timer: action.timer };
    case "hydrate":
      // replace with remote data, but keep device-local apiKey + current day
      return { ...action.state, apiKey: state.apiKey, selectedDate: state.selectedDate };
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
  // Instant render from the local cache (migrated to the current shape).
  const [state, dispatch] = useReducer(reducer, initialState, () => migrate(loadRaw()));

  // On boot in Telegram: pull the server copy. If the server has data, it wins
  // (cross-device source of truth). If it's empty, seed it from local.
  useEffect(() => {
    if (!canSync()) return;
    let cancelled = false;
    (async () => {
      const remote = await fetchRemote();
      if (cancelled) return;
      if (remote) dispatch({ type: "hydrate", state: migrate(remote) });
      else if (remote === null) pushRemote(migrate(loadRaw()));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist locally immediately + push to the server (debounced) on change.
  useEffect(() => {
    saveRaw(state);
    if (!canSync()) return;
    const id = setTimeout(() => pushRemote(state), 800);
    return () => clearTimeout(id);
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
