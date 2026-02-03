"use client";

import { useEffect, useRef, useState } from "react";

import { AutomateIcon } from "@/components/app-switcher";

export function HandoffLoader() {
  const [visible, setVisible] = useState(false);
  const shownAtRef = useRef<number | null>(null);
  const hideTimeoutRef = useRef<number | null>(null);
  const minimumDurationMs = 2400;

  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? window.sessionStorage.getItem("handoff-loading")
        : null;
    if (stored === "true") {
      setVisible(true);
      shownAtRef.current = Date.now();
    }

    const handleShow = () => {
      if (hideTimeoutRef.current) {
        window.clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
      shownAtRef.current = Date.now();
      setVisible(true);
    };
    const handleHide = () => {
      const shownAt = shownAtRef.current;
      if (!shownAt) {
        setVisible(false);
        return;
      }
      const elapsed = Date.now() - shownAt;
      const remaining = minimumDurationMs - elapsed;
      if (remaining <= 0) {
        setVisible(false);
        return;
      }
      hideTimeoutRef.current = window.setTimeout(() => {
        setVisible(false);
        hideTimeoutRef.current = null;
      }, remaining);
    };

    window.addEventListener("handoff:show", handleShow);
    window.addEventListener("handoff:hide", handleHide);

    return () => {
      if (hideTimeoutRef.current) {
        window.clearTimeout(hideTimeoutRef.current);
      }
      window.removeEventListener("handoff:show", handleShow);
      window.removeEventListener("handoff:hide", handleHide);
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className="handoff-loader">
      <div className="handoff-loader-orbit">
        <div className="handoff-loader-orbit-ring" />
        <div className="handoff-loader-orbit-dot handoff-loader-orbit-dot--one" />
        <div className="handoff-loader-orbit-dot handoff-loader-orbit-dot--two" />
        <div className="handoff-loader-orbit-dot handoff-loader-orbit-dot--three" />
        <div className="handoff-loader-card">
          <div className="handoff-loader-logo">
            <AutomateIcon />
          </div>
          <div className="handoff-loader-title">Agent OS</div>
          <div className="handoff-loader-subtitle">Booting your agent…</div>
        </div>
      </div>
    </div>
  );
}
