"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Clock,
  Filter,
  HelpCircle,
  Plus,
  Search,
  Settings,
  Star,
  Trash2,
  User,
} from "lucide-react";

import { AppSwitcher } from "@/components/app-switcher";
import { BrandKitBadge } from "@/components/brand-kit-badge";
import { BrandKitFlowOverlay } from "@/components/brand-kit-flow-overlay";
import { PolarisPanel } from "@/components/polaris-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { BrandKitInput, BrandKitItem } from "@/lib/brand-kit-types";

const formatDate = (value: string) => {
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

export function BrandKitProjects() {
  const [brandKits, setBrandKits] = useState<BrandKitItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [flowError, setFlowError] = useState<string | null>(null);
  const [flowOpen, setFlowOpen] = useState(false);
  const [flowMode, setFlowMode] = useState<"create" | "edit">("create");
  const [activeKit, setActiveKit] = useState<BrandKitItem | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchBrandKits = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const response = await fetch("/api/brand-kits");
        const data = (await response.json()) as
          | { ok: true; items: BrandKitItem[] }
          | { ok: false; error: string };
        if (!data.ok) {
          throw new Error(data.error);
        }
        setBrandKits(data.items);
      } catch (error) {
        setLoadError(
          error instanceof Error ? error.message : "Failed to load brand kits."
        );
      } finally {
        setLoading(false);
      }
    };
    void fetchBrandKits();
  }, []);

  const refreshBrandKits = async () => {
    try {
      const response = await fetch("/api/brand-kits");
      const data = (await response.json()) as
        | { ok: true; items: BrandKitItem[] }
        | { ok: false; error: string };
      if (data.ok) {
        setBrandKits(data.items);
      }
    } catch {
      // Ignore refresh errors; the list is already rendered.
    }
  };

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) {
      return brandKits;
    }
    return brandKits.filter((kit) =>
      kit.name.toLowerCase().includes(normalized)
    );
  }, [brandKits, search]);

  const handleOpenCreate = () => {
    setFlowMode("create");
    setActiveKit(null);
    setFlowError(null);
    setFlowOpen(true);
  };

  const handleOpenEdit = (kit: BrandKitItem) => {
    setFlowMode("edit");
    setActiveKit(kit);
    setFlowError(null);
    setFlowOpen(true);
  };

  const handleDelete = async (kit: BrandKitItem) => {
    const confirmed = window.confirm(
      `Delete "${kit.name}"? This cannot be undone.`
    );
    if (!confirmed) {
      return;
    }
    try {
      const response = await fetch("/api/brand-kits", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: kit.id }),
      });
      const data = (await response.json()) as
        | { ok: true }
        | { ok: false; error: string };
      if (!data.ok) {
        throw new Error(data.error);
      }
      setBrandKits((prev) => prev.filter((item) => item.id !== kit.id));
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "Failed to delete brand kit."
      );
    }
  };

  const handleStar = async (kit: BrandKitItem) => {
    const updated = { ...kit, starred: !kit.starred };
    setBrandKits((prev) =>
      prev.map((item) => (item.id === kit.id ? updated : item))
    );
    try {
      const response = await fetch("/api/brand-kits", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...updated, id: kit.id }),
      });
      const data = (await response.json()) as
        | { ok: true }
        | { ok: false; error: string };
      if (!data.ok) {
        throw new Error(data.error);
      }
    } catch (error) {
      setBrandKits((prev) =>
        prev.map((item) => (item.id === kit.id ? kit : item))
      );
      window.alert(
        error instanceof Error ? error.message : "Failed to update brand kit."
      );
    }
  };

  const handleSave = async (payload: BrandKitInput, id?: string) => {
    try {
      setSaving(true);
      setFlowError(null);
      const response = await fetch("/api/brand-kits", {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? { ...payload, id } : payload),
      });
      const data = (await response.json()) as
        | { ok: true; item: BrandKitItem }
        | { ok: false; error: string };
      if (!data.ok) {
        throw new Error(data.error);
      }
      if (id) {
        setBrandKits((prev) =>
          prev.map((item) => (item.id === id ? data.item : item))
        );
      } else {
        setBrandKits((prev) => [data.item, ...prev]);
      }
      setFlowOpen(false);
      setActiveKit(null);
      await refreshBrandKits();
    } catch (error) {
      setFlowError(
        error instanceof Error ? error.message : "Failed to save brand kit."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[color:var(--color-background)]">
      <header className="sticky top-0 z-20 border-b border-[color:var(--color-border)] bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <BrandKitBadge />
            <Button variant="ghost" size="sm" className="gap-2 text-[13px]">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <PolarisPanel pageContext="Brand Kit" />
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Search">
              <Search className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Help">
              <HelpCircle className="h-5 w-5" />
            </Button>
            <AppSwitcher />
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--color-surface-muted)] text-[11px] font-semibold">
              CM
            </div>
          </div>
        </div>
      </header>

      <div className="dashboard-shell">
        <main className="mx-auto w-full bg-[#f7f9fc] px-10 py-10 text-[16px] leading-[16px]">
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-5">
              <div className="flex flex-wrap items-center gap-5">
                <h1 className="text-[20px] font-semibold tracking-[0.2px] [font-variation-settings:'slnt'_0] text-[color:var(--text-primary-text-gray-900-body-black)]">
                  Brand Kits
                </h1>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-muted)]" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search for brand kits..."
                    className="h-9 w-[320px] rounded-md border-[color:var(--color-border)] pl-9 text-[13px]"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 border border-[color:var(--color-border)]"
                  aria-label="Filter brand kits"
                >
                  <Filter className="h-4 w-4 text-[color:var(--color-muted)]" />
                </Button>
              </div>
              <Button
                onClick={handleOpenCreate}
                className="h-9 gap-2 rounded-md bg-[color:var(--color-brand)] px-4 text-[13px] text-white shadow-sm hover:brightness-105"
              >
                <Plus className="h-4 w-4" />
                Create New Brand Kit
              </Button>
            </div>
            {loadError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-600">
                {loadError}
              </div>
            ) : null}

            <div className="mt-10 grid justify-start gap-5 pr-5 pb-5 [grid-template-columns:repeat(auto-fill,minmax(20rem,20rem))]">
              {filtered.map((kit) => (
                <Card
                  key={kit.id}
                  className="relative w-full max-w-[20rem] rounded-[4px] border border-[#dde3ee] bg-white transition-shadow duration-300 ease-in-out hover:shadow-md"
                >
                  <button
                    type="button"
                    className="absolute inset-0 z-0 rounded-[4px]"
                    aria-label={`Open ${kit.name}`}
                    onClick={() => handleOpenEdit(kit)}
                  />
                  <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
                    <CardTitle className="text-[16px] font-semibold leading-[1.5] tracking-[0.16px] text-[#212121]">
                      {kit.name}
                    </CardTitle>
                    <div className="relative z-10 flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-7 w-7 ${
                          kit.starred ? "text-[color:var(--color-brand)]" : ""
                        }`}
                        aria-label={
                          kit.starred ? "Unstar brand kit" : "Star brand kit"
                        }
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          handleStar(kit);
                        }}
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-[color:var(--color-muted)]"
                        aria-label="Delete brand kit"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          handleDelete(kit);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="space-y-3 px-6 pt-4 pb-4">
                      <div className="flex items-center justify-between text-[12px] text-[color:var(--color-muted)]">
                        <div className="flex flex-1 items-center justify-between gap-3">
                          <span className="text-[12px] font-normal leading-[18px] tracking-[-0.00228px]">
                            Goals
                          </span>
                          <span className="mb-1 text-[14px] font-semibold leading-[21px] text-[color:var(--color-foreground)]">
                            {kit.goals.length}
                          </span>
                        </div>
                        <div className="mx-3 h-8 w-px bg-[color:var(--color-border)]" />
                        <div className="flex flex-1 items-center justify-between gap-3">
                          <span className="text-[12px] font-normal leading-[18px] tracking-[-0.00228px]">
                            KPIs
                          </span>
                          <span className="mb-1 text-[14px] font-semibold leading-[21px] text-[color:var(--color-foreground)]">
                            {kit.websiteKpis.length}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex h-14 items-center justify-between rounded-b-[4px] rounded-t-none bg-[#edebff] px-[15px] py-[24px] text-[16px] leading-[16px] text-[color:var(--color-muted)]">
                      <span className="flex items-center gap-[5px] text-[12px] font-normal leading-[12px] tracking-[0.24px]">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white">
                          <User className="h-3.5 w-3.5" />
                        </span>
                        {kit.members} User
                      </span>
                      <span className="flex items-center gap-[5px] text-[12px] font-normal leading-[12px] tracking-[0.24px]">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(kit.updatedAt)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {loading ? (
              <div className="text-center text-sm text-[color:var(--color-muted)]">
                Loading brand kits...
              </div>
            ) : null}

            {!loading && filtered.length === 0 ? (
              <div className="text-center text-sm text-[color:var(--color-muted)]">
                No brand kits match your search.
              </div>
            ) : null}
          </div>
        </main>
        <aside
          id="polaris-dock"
          className="polaris-rail"
          aria-label="Polaris dock"
        />
      </div>

      <BrandKitFlowOverlay
        open={flowOpen}
        mode={flowMode}
        initialData={activeKit}
        saving={saving}
        error={flowError}
        onClose={() => setFlowOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
