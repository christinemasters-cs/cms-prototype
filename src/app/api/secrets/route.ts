import { NextResponse } from "next/server";

import {
  createConfig,
  deleteConfig,
  listConfig,
  updateConfig,
} from "@/lib/server/config-store";

const getProjectId = (request: Request) =>
  new URL(request.url).searchParams.get("projectId")?.trim() ?? "";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getStringProp = (value: Record<string, unknown>, key: string) =>
  typeof value[key] === "string" ? value[key] : "";

export async function GET(request: Request) {
  const projectId = getProjectId(request);
  if (!projectId) {
    return NextResponse.json({ ok: false, error: "projectId is required." }, { status: 400 });
  }
  const items = await listConfig("secrets", projectId);
  return NextResponse.json({ ok: true, items });
}

export async function POST(request: Request) {
  const body = (await request.json()) as unknown;
  if (!isRecord(body)) {
    return NextResponse.json({ ok: false, error: "Invalid payload." }, { status: 400 });
  }
  const projectId = getStringProp(body, "projectId").trim();
  const name = getStringProp(body, "name").trim();
  const value = getStringProp(body, "value");
  if (!projectId) {
    return NextResponse.json({ ok: false, error: "projectId is required." }, { status: 400 });
  }
  const result = await createConfig("secrets", projectId, name, value);
  if (result.error) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, item: result.item });
}

export async function PUT(request: Request) {
  const body = (await request.json()) as unknown;
  if (!isRecord(body)) {
    return NextResponse.json({ ok: false, error: "Invalid payload." }, { status: 400 });
  }
  const projectId = getStringProp(body, "projectId").trim();
  const id = getStringProp(body, "id").trim();
  const name = getStringProp(body, "name").trim();
  const value = getStringProp(body, "value");
  if (!projectId || !id) {
    return NextResponse.json({ ok: false, error: "projectId and id are required." }, { status: 400 });
  }
  const result = await updateConfig("secrets", projectId, id, name, value);
  if (result.error) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, item: result.item });
}

export async function DELETE(request: Request) {
  const body = (await request.json()) as unknown;
  if (!isRecord(body)) {
    return NextResponse.json({ ok: false, error: "Invalid payload." }, { status: 400 });
  }
  const projectId = getStringProp(body, "projectId").trim();
  const id = getStringProp(body, "id").trim();
  if (!projectId || !id) {
    return NextResponse.json({ ok: false, error: "projectId and id are required." }, { status: 400 });
  }
  const result = await deleteConfig("secrets", projectId, id);
  if (result.error) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 404 });
  }
  return NextResponse.json({ ok: true, removed: true });
}
