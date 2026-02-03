"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

type CalloutPosition = {
  left: number;
  top: number;
  pinX: number;
  pinY: number;
  bubbleWidth: number;
  bubbleHeight: number;
};

type FloatingCalloutProps = {
  anchorRef: RefObject<HTMLElement>;
  title: string;
  body: string;
  visible: boolean;
  inputValue?: string;
  inputPlaceholder?: string;
  onInputChange?: (value: string) => void;
  onSubmit?: () => void;
  suggestions?: string[];
  onSuggestionClick?: (value: string) => void;
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(value, max));

export function FloatingCallout({
  anchorRef,
  title,
  body,
  visible,
  inputValue,
  inputPlaceholder,
  onInputChange,
  onSubmit,
  suggestions,
  onSuggestionClick,
}: FloatingCalloutProps) {
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<CalloutPosition | null>(null);
  const lastPositionRef = useRef<CalloutPosition | null>(null);

  useLayoutEffect(() => {
    if (!visible) {
      setPosition(null);
      return;
    }
    const anchor = anchorRef.current;
    const update = () => {
      const bubble = bubbleRef.current;
      if (!anchor || !bubble) {
        return;
      }
      const anchorRect = anchor.getBoundingClientRect();
      const bubbleRect = bubble.getBoundingClientRect();
      const gap = 18;
      const fallbackLeft = anchorRect.left - gap - bubbleRect.width;
      const rightLeft = anchorRect.right + gap;
      const maxLeft = window.innerWidth - bubbleRect.width - 12;
      const left =
        rightLeft <= maxLeft
          ? rightLeft
          : clamp(fallbackLeft, 12, maxLeft);
      const top = clamp(
        anchorRect.top + anchorRect.height / 2 - bubbleRect.height / 2,
        12,
        window.innerHeight - bubbleRect.height - 12
      );
      const nextPosition: CalloutPosition = {
        left,
        top,
        pinX: anchorRect.left + anchorRect.width / 2,
        pinY: anchorRect.top + anchorRect.height / 2,
        bubbleWidth: bubbleRect.width,
        bubbleHeight: bubbleRect.height,
      };
      const prev = lastPositionRef.current;
      const delta =
        prev &&
        Math.abs(prev.left - nextPosition.left) +
          Math.abs(prev.top - nextPosition.top) +
          Math.abs(prev.pinX - nextPosition.pinX) +
          Math.abs(prev.pinY - nextPosition.pinY);
      if (!prev || (typeof delta === "number" && delta > 2)) {
        lastPositionRef.current = nextPosition;
        setPosition(nextPosition);
      }
    };

    update();
    window.requestAnimationFrame(update);
    const onScroll = () => update();
    const resizeObserver = anchor ? new ResizeObserver(update) : null;
    resizeObserver?.observe(anchor);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", onScroll, true);
      resizeObserver?.disconnect();
    };
  }, [anchorRef, inputValue, visible, suggestions?.length]);

  useEffect(() => {
    if (!visible) {
      setPosition(null);
    }
  }, [visible]);

  if (!visible) {
    return null;
  }

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[80]">
      {position ? (
        <>
          <div
            className="fixed h-px border-t border-dashed border-emerald-300"
            style={{
              left: position.pinX,
              top: position.pinY,
              width: Math.hypot(
                position.left - position.pinX,
                position.top + position.bubbleHeight / 2 - position.pinY
              ),
              transformOrigin: "0 0",
              transform: `rotate(${Math.atan2(
                position.top + position.bubbleHeight / 2 - position.pinY,
                position.left - position.pinX
              )}rad)`,
            }}
          />
          <div
            className="fixed h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.6)]"
            style={{ left: position.pinX, top: position.pinY }}
          />
          <div
            ref={bubbleRef}
            className="pointer-events-auto fixed w-full max-w-[260px] rounded-2xl border border-emerald-200/80 bg-white/95 px-4 py-3 text-left shadow-[0_20px_46px_rgba(16,185,129,0.35)] ring-1 ring-emerald-200/40"
            style={{ left: position.left, top: position.top }}
          >
            <div className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">
              {title}
            </div>
            <div className="mt-1 text-[12px] font-semibold text-[color:var(--color-foreground)]">
              {body}
            </div>
            <div className="mt-1 text-[11px] text-[color:var(--color-muted)]">
              Answer in the right panel to continue.
            </div>
            {suggestions && suggestions.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => onSuggestionClick?.(suggestion)}
                    className="rounded-full border border-emerald-200/80 bg-white px-2.5 py-1 text-[11px] text-[color:var(--color-foreground)] shadow-[0_6px_14px_rgba(16,185,129,0.12)] transition hover:border-emerald-300"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : null}
            {onSubmit && onInputChange ? (
              <div className="mt-3 flex items-center gap-2">
                <input
                  value={inputValue ?? ""}
                  onChange={(event) => onInputChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      onSubmit();
                    }
                  }}
                  placeholder={inputPlaceholder}
                  className="h-8 flex-1 rounded-md border border-emerald-200/80 bg-white px-2 text-[12px] text-[color:var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-emerald-200/60"
                />
                <button
                  type="button"
                  onClick={onSubmit}
                  className="h-8 rounded-md bg-emerald-500 px-3 text-[11px] font-semibold text-white shadow-sm transition hover:brightness-105"
                >
                  Submit
                </button>
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <div
          ref={bubbleRef}
          className="pointer-events-auto fixed left-1/2 top-1/3 w-full max-w-[260px] -translate-x-1/2 rounded-2xl border border-emerald-200/80 bg-white/95 px-4 py-3 text-left shadow-[0_20px_46px_rgba(16,185,129,0.35)] ring-1 ring-emerald-200/40"
        >
          <div className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">
            {title}
          </div>
          <div className="mt-1 text-[12px] font-semibold text-[color:var(--color-foreground)]">
            {body}
          </div>
          {suggestions && suggestions.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => onSuggestionClick?.(suggestion)}
                  className="rounded-full border border-emerald-200/80 bg-white px-2.5 py-1 text-[11px] text-[color:var(--color-foreground)] shadow-[0_6px_14px_rgba(16,185,129,0.12)] transition hover:border-emerald-300"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          ) : null}
          {onSubmit && onInputChange ? (
            <div className="mt-3 flex items-center gap-2">
              <input
                value={inputValue ?? ""}
                onChange={(event) => onInputChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    onSubmit();
                  }
                }}
                placeholder={inputPlaceholder}
                className="h-8 flex-1 rounded-md border border-emerald-200/80 bg-white px-2 text-[12px] text-[color:var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-emerald-200/60"
              />
              <button
                type="button"
                onClick={onSubmit}
                className="h-8 rounded-md bg-emerald-500 px-3 text-[11px] font-semibold text-white shadow-sm transition hover:brightness-105"
              >
                Submit
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>,
    document.body
  );
}
