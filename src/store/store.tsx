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
  type Habit,
  type ActivityRow,
  type FoodRow,
} from "../data";
import { loadState, saveState } from "./storage";

export interface AppState {
  habits: Habit[];
  activities: ActivityRow[];
  foods: FoodRow[];
}

const initialState: AppState = {
  habits: HABITS,
  activities: ACTIVITIES,
  foods: FOODS,
};

export type Action =
  | { type: "toggle_habit"; id: string }
  | { type: "add_habit"; habit: Habit }
  | { type: "update_habit"; habit: Habit }
  | { type: "delete_habit"; id: string }
  | { type: "delete_activity"; id: string }
  | { type: "delete_food"; id: string };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "toggle_habit":
      return {
        ...state,
        habits: state.habits.map((h) => {
          if (h.id !== action.id) return h;
          const done = !h.done;
          return {
            ...h,
            done,
            progress: done ? 1 : 0,
            progressText: done ? "Выполнено" : "Сегодня",
            streak: done ? h.streak + (h.streak === 0 ? 1 : 0) : h.streak,
          };
        }),
      };
    case "add_habit":
      return { ...state, habits: [...state.habits, action.habit] };
    case "update_habit":
      return {
        ...state,
        habits: state.habits.map((h) => (h.id === action.habit.id ? action.habit : h)),
      };
    case "delete_habit":
      return { ...state, habits: state.habits.filter((h) => h.id !== action.id) };
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
  const [state, dispatch] = useReducer(reducer, initialState, (init) =>
    loadState(init)
  );

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
