import { NextResponse } from "next/server";

import {
  createAgent,
  deleteAgent,
  getAgent,
  listAgents,
  updateAgent,
} from "@/lib/server/agent-store";

const getQueryParam = (request: Request, key: string) =>
  new URL(request.url).searchParams.get(key)?.trim() ?? "";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getStringProp = (value: Record<string, unknown>, key: string) =>
  typeof value[key] === "string" ? value[key] : "";

const getStringArrayProp = (value: Record<string, unknown>, key: string) =>
  Array.isArray(value[key])
    ? (value[key] as unknown[]).filter(
        (item): item is string => typeof item === "string"
      )
    : [];

export async function GET(request: Request) {
  const projectId = getQueryParam(request, "projectId");
  const id = getQueryParam(request, "id");
  if (!projectId) {
    return NextResponse.json(
      { ok: false, error: "projectId is required." },
      { status: 400 }
    );
  }
  if (id) {
    const item = await getAgent(projectId, id);
    if (!item) {
      return NextResponse.json(
        { ok: false, error: "Agent not found." },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, item });
  }
  const items = await listAgents(projectId);
  return NextResponse.json({ ok: true, items });
}

export async function POST(request: Request) {
  const body = (await request.json()) as unknown;
  if (!isRecord(body)) {
    return NextResponse.json(
      { ok: false, error: "Invalid payload." },
      { status: 400 }
    );
  }
  const projectId = getStringProp(body, "projectId").trim();
  const name = getStringProp(body, "name");
  const description = getStringProp(body, "description");
  const instructions = getStringProp(body, "instructions");
  const triggers = getStringArrayProp(body, "triggers");
  const tools = getStringArrayProp(body, "tools");
  const active = Boolean(body.active);
  if (!projectId) {
    return NextResponse.json(
      { ok: false, error: "projectId is required." },
      { status: 400 }
    );
  }
  const result = await createAgent({
    projectId,
    name,
    description,
    instructions,
    triggers,
    tools,
    active,
  });
  if (result.error) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 400 }
    );
  }
  return NextResponse.json({ ok: true, item: result.item });
}

export async function PUT(request: Request) {
  const body = (await request.json()) as unknown;
  if (!isRecord(body)) {
    return NextResponse.json(
      { ok: false, error: "Invalid payload." },
      { status: 400 }
    );
  }
  const projectId = getStringProp(body, "projectId").trim();
  const id = getStringProp(body, "id").trim();
  const name = getStringProp(body, "name");
  const description = getStringProp(body, "description");
  const instructions = getStringProp(body, "instructions");
  const triggers = getStringArrayProp(body, "triggers");
  const tools = getStringArrayProp(body, "tools");
  const active = Boolean(body.active);
  if (!projectId || !id) {
    return NextResponse.json(
      { ok: false, error: "projectId and id are required." },
      { status: 400 }
    );
  }
  const result = await updateAgent({
    projectId,
    id,
    name,
    description,
    instructions,
    triggers,
    tools,
    active,
  });
  if (result.error) {
    const status = result.error === "Agent not found." ? 404 : 400;
    return NextResponse.json(
      { ok: false, error: result.error },
      { status }
    );
  }
  return NextResponse.json({ ok: true, item: result.item });
}

export async function DELETE(request: Request) {
  const body = (await request.json()) as unknown;
  if (!isRecord(body)) {
    return NextResponse.json(
      { ok: false, error: "Invalid payload." },
      { status: 400 }
    );
  }
  const projectId = getStringProp(body, "projectId").trim();
  const id = getStringProp(body, "id").trim();
  if (!projectId || !id) {
    return NextResponse.json(
      { ok: false, error: "projectId and id are required." },
      { status: 400 }
    );
  }
  const result = await deleteAgent(projectId, id);
  if (result.error) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 404 }
    );
  }
  return NextResponse.json({ ok: true, removed: true });
}
