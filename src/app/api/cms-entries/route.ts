import { NextResponse } from "next/server";

import type { CmsEntryInput } from "@/lib/cms-entry-types";
import {
  createEntry,
  getEntry,
  listEntries,
  updateEntry,
} from "@/lib/server/cms-entry-store";

export const runtime = "nodejs";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getQueryParam = (request: Request, key: string) =>
  new URL(request.url).searchParams.get(key)?.trim() ?? "";

const getStringProp = (value: Record<string, unknown>, key: string) =>
  typeof value[key] === "string" ? value[key] : "";

const getNumberProp = (value: Record<string, unknown>, key: string) =>
  typeof value[key] === "number" ? value[key] : 0;

const getArrayProp = (value: Record<string, unknown>, key: string) =>
  Array.isArray(value[key]) ? value[key] : [];

const getRecordProp = (value: Record<string, unknown>, key: string) =>
  isRecord(value[key]) ? (value[key] as Record<string, unknown>) : {};

const buildInput = (value: Record<string, unknown>): CmsEntryInput => {
  const fields = getRecordProp(value, "fields");
  return {
    title: getStringProp(value, "title"),
    language: getStringProp(value, "language"),
    contentType: getStringProp(value, "contentType"),
    variants: getStringProp(value, "variants"),
    version: getNumberProp(value, "version"),
    status: getArrayProp(value, "status") as CmsEntryInput["status"],
    fields: {
      singleLine: getStringProp(fields, "singleLine"),
      multiLine: getStringProp(fields, "multiLine"),
      richText: getStringProp(fields, "richText"),
      jsonRichText: getStringProp(fields, "jsonRichText"),
    },
  };
};

export async function GET(request: Request) {
  const id = getQueryParam(request, "id");
  if (id) {
    const item = await getEntry(id);
    if (!item) {
      return NextResponse.json(
        { ok: false, error: "Entry not found." },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, item });
  }
  const items = await listEntries();
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
  const result = await createEntry(buildInput(body));
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
  const id = getStringProp(body, "id").trim();
  if (!id) {
    return NextResponse.json(
      { ok: false, error: "id is required." },
      { status: 400 }
    );
  }
  const result = await updateEntry(id, buildInput(body));
  if (result.error) {
    const status = result.error === "Entry not found." ? 404 : 400;
    return NextResponse.json({ ok: false, error: result.error }, { status });
  }
  return NextResponse.json({ ok: true, item: result.item });
}
