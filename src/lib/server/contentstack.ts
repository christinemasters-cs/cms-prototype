import "server-only";

type ContentstackRegion = "na" | "us" | "eu" | "azure-na" | "azure-eu";

export type ContentTypeSummary = {
  uid: string;
  title: string;
  description?: string;
};

export type EntryPayload = Record<string, unknown>;

type ContentstackConfig = {
  apiKey: string;
  managementToken: string;
  region: ContentstackRegion;
};

const REGION_BASE_URL: Record<ContentstackRegion, string> = {
  na: "https://api.contentstack.io/v3",
  us: "https://api.contentstack.io/v3",
  eu: "https://eu-api.contentstack.com/v3",
  "azure-na": "https://azure-na-api.contentstack.com/v3",
  "azure-eu": "https://azure-eu-api.contentstack.com/v3",
};

function getConfig(): ContentstackConfig {
  const apiKey = process.env.CONTENTSTACK_API_KEY?.trim();
  const managementToken = process.env.CONTENTSTACK_MANAGEMENT_TOKEN?.trim();
  const region =
    (process.env.CONTENTSTACK_REGION?.toLowerCase() as ContentstackRegion | undefined) ??
    "na";

  if (!apiKey || !managementToken) {
    throw new Error("Missing Contentstack environment variables.");
  }
  const asciiCheck = (value: string, label: string) => {
    for (let i = 0; i < value.length; i += 1) {
      if (value.charCodeAt(i) > 127) {
        throw new Error(`${label} contains non-ASCII characters.`);
      }
    }
  };
  asciiCheck(apiKey, "CONTENTSTACK_API_KEY");
  asciiCheck(managementToken, "CONTENTSTACK_MANAGEMENT_TOKEN");

  if (!REGION_BASE_URL[region]) {
    throw new Error(`Unsupported Contentstack region: ${region}`);
  }

  return { apiKey, managementToken, region };
}

async function contentstackFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const { apiKey, managementToken, region } = getConfig();
  const baseUrl = REGION_BASE_URL[region];
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      api_key: apiKey,
      authorization: managementToken,
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Contentstack error ${response.status}: ${text}`);
  }

  return (await response.json()) as T;
}

export async function getAllContentTypes(): Promise<ContentTypeSummary[]> {
  const data = await contentstackFetch<{
    content_types?: Array<{ uid: string; title: string; description?: string }>;
  }>("/content_types?include_global_field_schema=true");

  return data.content_types?.map((item) => ({
    uid: item.uid,
    title: item.title,
    description: item.description,
  })) ?? [];
}

export async function getContentType(uid: string) {
  return contentstackFetch<{ content_type: Record<string, unknown> }>(
    `/content_types/${encodeURIComponent(uid)}`
  );
}

export async function getAllEntries(
  contentTypeUid: string,
  locale?: string,
  limit?: number
) {
  const params = new URLSearchParams();
  if (locale) {
    params.set("locale", locale);
  }
  if (typeof limit === "number") {
    params.set("limit", String(limit));
  }
  const query = params.toString();
  return contentstackFetch<{ entries: Record<string, unknown>[] }>(
    `/content_types/${encodeURIComponent(contentTypeUid)}/entries${query ? `?${query}` : ""}`
  );
}

export async function getEntry(
  contentTypeUid: string,
  entryUid: string,
  locale?: string
) {
  const params = new URLSearchParams();
  if (locale) {
    params.set("locale", locale);
  }
  const query = params.toString();
  return contentstackFetch<{ entry: Record<string, unknown> }>(
    `/content_types/${encodeURIComponent(contentTypeUid)}/entries/${encodeURIComponent(
      entryUid
    )}${query ? `?${query}` : ""}`
  );
}

export async function createEntry(
  contentTypeUid: string,
  entry: EntryPayload
) {
  return contentstackFetch<{ entry: Record<string, unknown> }>(
    `/content_types/${encodeURIComponent(contentTypeUid)}/entries`,
    {
      method: "POST",
      body: JSON.stringify({ entry }),
    }
  );
}

export async function updateEntry(
  contentTypeUid: string,
  entryUid: string,
  entry: EntryPayload
) {
  return contentstackFetch<{ entry: Record<string, unknown> }>(
    `/content_types/${encodeURIComponent(contentTypeUid)}/entries/${encodeURIComponent(
      entryUid
    )}`,
    {
      method: "PUT",
      body: JSON.stringify({ entry }),
    }
  );
}
