"use client";

import { useEffect, useId, useState } from "react";
import { Bot, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export function PolarisPanel() {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        aria-label="Open Polaris"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((prev) => !prev)}
      >
        <PolarisIcon className="h-4 w-4" />
      </Button>

      {open ? (
        <aside
          id={panelId}
          className="fixed right-6 top-24 z-30 hidden w-80 flex-col gap-4 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 shadow-lg xl:flex"
          role="dialog"
          aria-label="Polaris assistant"
          aria-modal="false"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand)]">
                <Bot className="h-4 w-4" />
              </span>
              Polaris
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close Polaris"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Separator />
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand)]">
              <PolarisIcon className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold">Introducing Polaris</p>
              <p className="text-xs text-[color:var(--color-muted)]">
                A virtual co-worker helping you get more done across Contentstack.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Input placeholder="Describe what you would like to do..." />
            <p className="text-[10px] text-[color:var(--color-muted)]">
              Not sure what to ask?{" "}
              <span className="text-[color:var(--color-brand)]">
                See what I can do
              </span>
            </p>
          </div>
        </aside>
      ) : null}
    </>
  );
}

function PolarisIcon({ className }: { className?: string }) {
  const gradientId = useId();
  const paint0 = `${gradientId}-paint0`;
  const paint1 = `${gradientId}-paint1`;
  const paint2 = `${gradientId}-paint2`;

  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12.7 6.705c.285-.716 1.315-.716 1.599 0l.026.074 1.026 3.37 3.37 1.026c.815.248.815 1.402 0 1.65l-3.37 1.026-1.026 3.37c-.248.815-1.402.815-1.65 0l-1.027-3.37-3.369-1.026c-.815-.248-.815-1.402 0-1.65l3.37-1.027 1.026-3.369.026-.074zm-.015 3.905a.863.863 0 01-.575.575L9.433 12l2.678.815c.241.073.436.247.537.474l.038.1.815 2.679.815-2.679.037-.1a.863.863 0 01.537-.474L17.568 12l-2.679-.815a.863.863 0 01-.574-.575L13.5 7.933l-.815 2.678z"
        fill={`url(#${paint0})`}
      />
      <path
        d="M7.357 3.433a.15.15 0 01.285 0l.577 1.753a.15.15 0 00.095.095l1.753.576a.15.15 0 010 .285l-1.753.577a.15.15 0 00-.095.095l-.577 1.753a.15.15 0 01-.285 0l-.576-1.753a.15.15 0 00-.095-.095l-1.753-.577a.15.15 0 010-.285l1.753-.576a.15.15 0 00.095-.095l.576-1.753z"
        fill={`url(#${paint1})`}
      />
      <path
        d="M7.357 15.433a.15.15 0 01.285 0l.577 1.753a.15.15 0 00.095.095l1.753.577a.15.15 0 010 .284l-1.753.577a.15.15 0 00-.095.095l-.577 1.753a.15.15 0 01-.285 0l-.576-1.753a.15.15 0 00-.095-.095l-1.753-.577a.15.15 0 010-.284l1.753-.577a.15.15 0 00.095-.095l.576-1.753z"
        fill={`url(#${paint2})`}
      />
      <defs>
        <linearGradient
          id={paint0}
          x1="3.541"
          y1="2.635"
          x2="25.745"
          y2="15.114"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#49A466" />
          <stop offset="0.5" stopColor="#6F83F2" />
          <stop offset="1" stopColor="#8A3DFF" />
        </linearGradient>
        <linearGradient
          id={paint1}
          x1="3.541"
          y1="2.635"
          x2="25.745"
          y2="15.114"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#49A466" />
          <stop offset="0.5" stopColor="#6F83F2" />
          <stop offset="1" stopColor="#8A3DFF" />
        </linearGradient>
        <linearGradient
          id={paint2}
          x1="3.541"
          y1="2.635"
          x2="25.745"
          y2="15.114"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#49A466" />
          <stop offset="0.5" stopColor="#6F83F2" />
          <stop offset="1" stopColor="#8A3DFF" />
        </linearGradient>
      </defs>
    </svg>
  );
}
