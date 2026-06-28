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

interface TgInset {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface TelegramWebApp {
  ready(): void;
  expand(): void;
  colorScheme: ThemeName;
  themeParams: Record<string, string>;
  viewportStableHeight?: number;
  setHeaderColor(color: string): void;
  setBackgroundColor(color: string): void;
  safeAreaInset?: TgInset; // device safe area (status bar / notch)
  contentSafeAreaInset?: TgInset; // area below Telegram's own header
  onEvent(event: string, cb: () => void): void;
  offEvent(event: string, cb: () => void): void;
  MainButton: TgMainButton;
  BackButton: TgBackButton;
  HapticFeedback: TgHaptic;
  platform: string; // "unknown" when the SDK is loaded outside a Telegram client
  initData: string;
  initDataUnsafe?: { user?: { first_name?: string } };
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

export const tg: TelegramWebApp | undefined = window.Telegram?.WebApp;
// The SDK script defines window.Telegram.WebApp even in a normal browser, where
// platform is "unknown" and MainButton/BackButton render nothing. Treat only a
// real client session as "Telegram" so the in-page controls show otherwise.
export const hasTelegram = !!tg && tg.platform !== "unknown";

// Push Telegram's safe-area + content-safe-area insets into CSS variables so
// the layout never hides under the iOS status bar or Telegram's header.
function applySafeAreas(): void {
  if (!tg) return;
  // Old clients (Bot API < 8.0) lack the inset API — leave the CSS env()
  // fallback in place instead of overriding it with zeros.
  if (!tg.safeAreaInset && !tg.contentSafeAreaInset) return;
  const zero = { top: 0, bottom: 0, left: 0, right: 0 };
  const sa = tg.safeAreaInset ?? zero;
  const ca = tg.contentSafeAreaInset ?? zero;
  const px = (n: number) => `${Math.max(0, Math.round(n || 0))}px`;
  const root = document.documentElement.style;
  root.setProperty("--tg-top", px(sa.top + ca.top));
  root.setProperty("--tg-bottom", px(sa.bottom + ca.bottom));
  root.setProperty("--tg-left", px(sa.left + ca.left));
  root.setProperty("--tg-right", px(sa.right + ca.right));
}

export function initTelegram(): void {
  if (!tg) return;
  tg.ready();
  tg.expand();
  applySafeAreas();
  tg.onEvent("safeAreaChanged", applySafeAreas);
  tg.onEvent("contentSafeAreaChanged", applySafeAreas);
  tg.onEvent("viewportChanged", applySafeAreas);
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
  if (!tg || !hasTelegram) return false;
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
