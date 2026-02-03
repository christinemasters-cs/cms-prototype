import { NextResponse } from "next/server";

import type { BrandKitInput } from "@/lib/brand-kit-types";
import {
  createBrandKit,
  deleteBrandKit,
  getBrandKit,
  listBrandKits,
  updateBrandKit,
} from "@/lib/server/brand-kit-store";

export const runtime = "nodejs";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getQueryParam = (request: Request, key: string) =>
  new URL(request.url).searchParams.get(key)?.trim() ?? "";

const getStringProp = (value: Record<string, unknown>, key: string) =>
  typeof value[key] === "string" ? value[key] : "";

const getNumberProp = (value: Record<string, unknown>, key: string) =>
  typeof value[key] === "number" ? value[key] : undefined;

const getBooleanProp = (value: Record<string, unknown>, key: string) =>
  typeof value[key] === "boolean" ? value[key] : undefined;

const getArrayProp = (value: Record<string, unknown>, key: string) =>
  Array.isArray(value[key]) ? value[key] : [];

const buildInput = (value: Record<string, unknown>): BrandKitInput => ({
  name: getStringProp(value, "name"),
  mission: getStringProp(value, "mission"),
  goals: getArrayProp(value, "goals") as BrandKitInput["goals"],
  websiteKpis: getArrayProp(value, "websiteKpis") as BrandKitInput["websiteKpis"],
  members: getNumberProp(value, "members"),
  starred: getBooleanProp(value, "starred"),
});

export async function GET(request: Request) {
  const id = getQueryParam(request, "id");
  if (id) {
    const item = await getBrandKit(id);
    if (!item) {
      return NextResponse.json(
        { ok: false, error: "Brand kit not found." },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, item });
  }
  const items = await listBrandKits();
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
  const result = await createBrandKit(buildInput(body));
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
  const result = await updateBrandKit(id, buildInput(body));
  if (result.error) {
    const status = result.error === "Brand kit not found." ? 404 : 400;
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
  const id = getStringProp(body, "id").trim();
  if (!id) {
    return NextResponse.json(
      { ok: false, error: "id is required." },
      { status: 400 }
    );
  }
  const result = await deleteBrandKit(id);
  if (result.error) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 404 }
    );
  }
  return NextResponse.json({ ok: true, removed: true });
}
