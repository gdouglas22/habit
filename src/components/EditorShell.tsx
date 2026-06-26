import { useEffect, useRef, type ReactNode } from "react";
import { ACCENT } from "../theme";
import {
  hasTelegram,
  showMainButton,
  hideMainButton,
  setMainButtonEnabled,
  showBackButton,
  hideBackButton,
} from "../telegram";
import { ChevronLeft, Trash } from "../icons";

// Shared full-screen editor chrome: back header, Telegram MainButton (save) +
// BackButton (close), optional delete, and an in-page save fallback.
export function EditorShell({
  title,
  canSave,
  onSave,
  onClose,
  onDelete,
  deleteLabel = "Удалить",
  children,
}: {
  title: string;
  canSave: boolean;
  onSave: () => void;
  onClose: () => void;
  onDelete?: () => void;
  deleteLabel?: string;
  children: ReactNode;
}) {
  const saveRef = useRef(onSave);
  saveRef.current = onSave;

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
    setMainButtonEnabled(canSave);
  }, [canSave]);

  return (
    <div className="app">
      <div className="screen noscroll" style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "14px 16px 0", flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
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
            <div style={{ fontSize: 19, fontWeight: 900, color: "var(--text)" }}>{title}</div>
          </div>

          {children}

          {onDelete && (
            <button
              onClick={onDelete}
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
              {deleteLabel}
            </button>
          )}

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
                onClick={onSave}
                disabled={!canSave}
                style={{
                  width: "100%",
                  border: "none",
                  borderRadius: 16,
                  background: ACCENT,
                  color: "#fff",
                  fontWeight: 900,
                  fontSize: 16,
                  padding: 15,
                  cursor: canSave ? "pointer" : "not-allowed",
                  opacity: canSave ? 1 : 0.5,
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

export const fieldLabel: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
  color: "var(--hint)",
  marginBottom: 10,
};

export const stepBtn: React.CSSProperties = {
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
