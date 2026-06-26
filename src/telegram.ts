// Thin wrapper around the Telegram WebApp SDK injected by telegram-web-app.js.
// Falls back gracefully when running in a normal browser (local dev).

import type { ThemeName } from "./theme";

interface TgMainButton {
  setText(t: string): TgMainButton;
  show(): TgMainButton;
  hide(): TgMainButton;
  enable(): TgMainButton;
  disable(): TgMainButton;
  onClick(cb: () => void): TgMainButton;
  offClick(cb: () => void): TgMainButton;
  setParams(p: Record<string, unknown>): TgMainButton;
}

interface TgBackButton {
  show(): TgBackButton;
  hide(): TgBackButton;
  onClick(cb: () => void): TgBackButton;
  offClick(cb: () => void): TgBackButton;
}

interface TgHaptic {
  impactOccurred(style: "light" | "medium" | "heavy" | "rigid" | "soft"): void;
  notificationOccurred(type: "error" | "success" | "warning"): void;
  selectionChanged(): void;
}

export interface TelegramWebApp {
  ready(): void;
  expand(): void;
  colorScheme: ThemeName;
  themeParams: Record<string, string>;
  viewportStableHeight?: number;
  setHeaderColor(color: string): void;
  setBackgroundColor(color: string): void;
  onEvent(event: string, cb: () => void): void;
  offEvent(event: string, cb: () => void): void;
  MainButton: TgMainButton;
  BackButton: TgBackButton;
  HapticFeedback: TgHaptic;
  initDataUnsafe?: { user?: { first_name?: string } };
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

export const tg: TelegramWebApp | undefined = window.Telegram?.WebApp;
export const hasTelegram = !!tg;

export function initTelegram(): void {
  if (!tg) return;
  tg.ready();
  tg.expand();
}

export function preferredTheme(): ThemeName {
  return tg?.colorScheme === "dark" ? "dark" : "light";
}

export function haptic(style: "light" | "medium" | "heavy" = "light"): void {
  tg?.HapticFeedback?.impactOccurred(style);
}

export function notifySuccess(): void {
  tg?.HapticFeedback?.notificationOccurred("success");
}

export function syncChrome(bg: string, header: string): void {
  try {
    tg?.setBackgroundColor(bg);
    tg?.setHeaderColor(header);
  } catch {
    /* setHeaderColor only accepts bg_color/secondary_bg_color on old clients */
  }
}

// --- MainButton ---------------------------------------------------------
let mainCb: (() => void) | null = null;

export function showMainButton(text: string, cb: () => void): boolean {
  if (!tg) return false;
  if (mainCb) tg.MainButton.offClick(mainCb);
  mainCb = cb;
  tg.MainButton.setText(text);
  tg.MainButton.onClick(cb);
  tg.MainButton.show();
  return true;
}

export function setMainButtonEnabled(enabled: boolean): void {
  if (!tg) return;
  if (enabled) tg.MainButton.enable();
  else tg.MainButton.disable();
}

export function hideMainButton(): void {
  if (!tg) return;
  if (mainCb) {
    tg.MainButton.offClick(mainCb);
    mainCb = null;
  }
  tg.MainButton.hide();
}

// --- BackButton ---------------------------------------------------------
let backCb: (() => void) | null = null;

export function showBackButton(cb: () => void): void {
  if (!tg) return;
  if (backCb) tg.BackButton.offClick(backCb);
  backCb = cb;
  tg.BackButton.onClick(cb);
  tg.BackButton.show();
}

export function hideBackButton(): void {
  if (!tg) return;
  if (backCb) {
    tg.BackButton.offClick(backCb);
    backCb = null;
  }
  tg.BackButton.hide();
}
