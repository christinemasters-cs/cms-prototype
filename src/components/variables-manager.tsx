"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ConfigItem = {
  id: string;
  name: string;
  value: string;
  createdAt: string;
  updatedAt: string;
};

type ConfigResponse =
  | { ok: true; items: ConfigItem[] }
  | { ok: false; error: string };

type ConfigItemResponse =
  | { ok: true; item: ConfigItem }
  | { ok: false; error: string };

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));

export function VariablesManager({ projectId }: { projectId: string }) {
  const [items, setItems] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newValue, setNewValue] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftValue, setDraftValue] = useState("");

  const loadItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/variables?projectId=${encodeURIComponent(projectId)}`
      );
      const data = (await response.json()) as ConfigResponse;
      if (!data.ok) {
        throw new Error(data.error);
      }
      setItems(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load variables.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
  }, [projectId]);

  const handleCreate = async () => {
    if (!newName.trim() || saving) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/variables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          name: newName.trim(),
          value: newValue,
        }),
      });
      const data = (await response.json()) as ConfigItemResponse;
      if (!data.ok) {
        throw new Error(data.error);
      }
      setItems((prev) => [data.item, ...prev]);
      setNewName("");
      setNewValue("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add variable.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item: ConfigItem) => {
    setEditingId(item.id);
    setDraftName(item.name);
    setDraftValue(item.value);
  };

  const handleUpdate = async () => {
    if (!editingId || !draftName.trim() || saving) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/variables", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          id: editingId,
          name: draftName.trim(),
          value: draftValue,
        }),
      });
      const data = (await response.json()) as ConfigItemResponse;
      if (!data.ok) {
        throw new Error(data.error);
      }
      setItems((prev) =>
        prev.map((item) => (item.id === editingId ? data.item : item))
      );
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update variable.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (saving) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/variables", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, id }),
      });
      const data = (await response.json()) as { ok: boolean; error?: string };
      if (!data.ok) {
        throw new Error(data.error ?? "Failed to delete variable.");
      }
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete variable.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[12px] text-[color:var(--color-muted)]">
            Automate Projects
          </p>
          <h1 className="text-[18px] font-semibold text-[color:var(--color-foreground)]">
            Variables
          </h1>
          <p className="mt-1 text-[12px] text-[color:var(--color-muted)]">
            Use in agents with <span className="font-semibold">{`{{var.NAME}}`}</span>
          </p>
        </div>
      </div>

      <Card className="border border-[color:var(--color-border)] bg-white shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-[13px] font-semibold text-[color:var(--color-muted)]">
            Add Variable
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <label className="text-[11px] font-medium text-[color:var(--color-muted)]">
              Name
            </label>
            <Input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="admin_email"
              className="mt-1 h-9 rounded-md border-[color:var(--color-border)] text-[13px]"
            />
          </div>
          <div className="min-w-[240px] flex-[2]">
            <label className="text-[11px] font-medium text-[color:var(--color-muted)]">
              Value
            </label>
            <Input
              value={newValue}
              onChange={(event) => setNewValue(event.target.value)}
              placeholder="admin@company.com"
              className="mt-1 h-9 rounded-md border-[color:var(--color-border)] text-[13px]"
            />
          </div>
          <Button
            className="h-9 gap-2 rounded-md bg-[color:var(--color-brand)] px-4 text-[13px] text-white shadow-sm hover:brightness-105"
            onClick={handleCreate}
            disabled={saving || !newName.trim()}
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </CardContent>
      </Card>

      <Card className="border border-[color:var(--color-border)] bg-white shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-[13px] font-semibold text-[color:var(--color-muted)]">
            Saved Variables
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-600">
              {error}
            </div>
          ) : null}
          {loading ? (
            <div className="text-[12px] text-[color:var(--color-muted)]">
              Loading variables...
            </div>
          ) : null}
          {!loading && items.length === 0 ? (
            <div className="text-[12px] text-[color:var(--color-muted)]">
              No variables yet. Add one to reuse across agents.
            </div>
          ) : null}
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-md border border-[color:var(--color-border)] px-3 py-3"
            >
              {editingId === item.id ? (
                <div className="flex flex-wrap items-center gap-3">
                  <Input
                    value={draftName}
                    onChange={(event) => setDraftName(event.target.value)}
                    className="h-9 min-w-[180px] flex-1 rounded-md border-[color:var(--color-border)] text-[13px]"
                  />
                  <Input
                    value={draftValue}
                    onChange={(event) => setDraftValue(event.target.value)}
                    className="h-9 min-w-[240px] flex-[2] rounded-md border-[color:var(--color-border)] text-[13px]"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={handleUpdate}
                    aria-label="Save variable"
                  >
                    <Save className="h-4 w-4 text-[color:var(--color-brand)]" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setEditingId(null)}
                    aria-label="Cancel edit"
                  >
                    <X className="h-4 w-4 text-[color:var(--color-muted)]" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-[13px] font-semibold text-[color:var(--color-foreground)]">
                      {item.name}
                    </div>
                    <div className="text-[12px] text-[color:var(--color-muted)]">
                      {item.value}
                    </div>
                    <div className="mt-1 text-[11px] text-[color:var(--color-muted)]">
                      Updated {formatDate(item.updatedAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[color:var(--color-muted)]">
                    <span className="rounded-full border border-[color:var(--color-border)] px-2 py-1">
                      {`{{var.${item.name}}}`}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => startEdit(item)}
                      aria-label="Edit variable"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => void handleDelete(item.id)}
                      aria-label="Delete variable"
                    >
                      <Trash2 className="h-4 w-4 text-[color:var(--color-muted)]" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
