// GLEIF — Global Legal Entity Identifier Foundation
// Free, no API key required. Covers 2M+ entities in 200+ jurisdictions.
//
// API quirk: fuzzycompletions stores the LEI at
//   relationships['lei-records'].data.id  (NOT attributes.lei)
//
// Search strategy:
//   1. Known name override (for display names that differ from legal entity name)
//   2. fuzzycompletions — picks best non-empty-LEI result by start-of-string match
//   3. Fallback: lei-records filter search for the name (or stripped name)

export const revalidate = 86400; // 24 hours

// Known overrides: display name (lower) → GLEIF legal name to search
const GLEIF_OVERRIDES: Record<string, string> = {
  "sit group":              "SIT S.p.A.",
  "ebm-papst":              "ebm-papst Mulfingen GmbH",
  "georg fischer piping systems": "Georg Fischer AG",
  "db schenker":            "Schenker AG",
};

async function gleifFetch(url: string) {
  const res = await fetch(url, { headers: { Accept: "application/vnd.api+json" } });
  if (!res.ok) return null;
  return res.json();
}

// Extract LEI from a fuzzycompletion item
function extractLei(item: Record<string, unknown>): string | undefined {
  const rels = item.relationships as Record<string, unknown> | undefined;
  const leiRec = rels?.["lei-records"] as Record<string, unknown> | undefined;
  const data = leiRec?.data as Record<string, unknown> | undefined;
  const id = data?.id as string | undefined;
  return id || undefined; // treat empty string as missing
}

// Pick best completion: prefer shortest name that starts with query, has a LEI
function pickBestCompletion(
  completions: Record<string, unknown>[],
  query: string
): Record<string, unknown> | null {
  const q = query.toLowerCase();
  const withLei = completions.filter((c) => !!extractLei(c));
  if (!withLei.length) return null;

  // Prefer starts-with match
  const startsWith = withLei.filter((c) => {
    const val = ((c.attributes as Record<string, unknown>)?.value as string ?? "").toLowerCase();
    return val.startsWith(q);
  });
  const pool = startsWith.length ? startsWith : withLei;

  // From pool, prefer shortest legal name (most likely parent/HQ entity)
  return pool.sort((a, b) => {
    const aLen = ((a.attributes as Record<string, unknown>)?.value as string ?? "").length;
    const bLen = ((b.attributes as Record<string, unknown>)?.value as string ?? "").length;
    return aLen - bLen;
  })[0];
}

// Fuzzy completions search — returns best [lei, matchedName] or null
async function searchFuzzy(term: string): Promise<[string, string] | null> {
  const data = await gleifFetch(
    `https://api.gleif.org/api/v1/fuzzycompletions?field=entity.legalName&q=${encodeURIComponent(term)}&page[size]=10`
  );
  const completions = (data?.data ?? []) as Record<string, unknown>[];
  const best = pickBestCompletion(completions, term);
  if (!best) return null;
  const lei = extractLei(best);
  if (!lei) return null;
  const name = (best.attributes as Record<string, unknown>)?.value as string | undefined;
  return [lei, name ?? term];
}

// Exact filter search — more reliable for known legal names
async function searchFilter(term: string): Promise<[string, string] | null> {
  const data = await gleifFetch(
    `https://api.gleif.org/api/v1/lei-records?filter[entity.legalName]=${encodeURIComponent(term)}&page[size]=5`
  );
  const items = (data?.data ?? []) as Record<string, unknown>[];
  // Prefer ACTIVE entities
  const active = items.filter(
    (i) =>
      ((i.attributes as Record<string, unknown>)?.entity as Record<string, unknown>)
        ?.status === "ACTIVE"
  );
  const hit = (active.length ? active : items)[0];
  if (!hit) return null;
  const lei = hit.id as string | undefined;
  if (!lei) return null;
  const name =
    (
      ((hit.attributes as Record<string, unknown>)?.entity as Record<string, unknown>)
        ?.legalName as Record<string, string>
    )?.name ?? term;
  return [lei, name];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");
  if (!name) return Response.json({ error: "name param required" }, { status: 400 });

  try {
    const override = GLEIF_OVERRIDES[name.toLowerCase().trim()];
    const searchTerms = override
      ? [override, name]
      : [name, name.replace(/\s+(group|holding|industries|technologies|systems|solutions)\b/gi, "").trim()];

    // Deduplicate
    const terms = [...new Set(searchTerms.filter(Boolean))];

    let lei: string | undefined;
    let matchedName: string | undefined;

    // Try fuzzy completions for each term
    for (const term of terms) {
      const result = await searchFuzzy(term);
      if (result) { [lei, matchedName] = result; break; }
    }

    // Fallback: exact filter search
    if (!lei) {
      for (const term of terms) {
        const result = await searchFilter(term);
        if (result) { [lei, matchedName] = result; break; }
      }
    }

    if (!lei) return Response.json({ found: false, name, searched: terms });

    // Fetch full LEI record
    const record = await gleifFetch(`https://api.gleif.org/api/v1/lei-records/${lei}`);
    if (!record) return Response.json({ found: false, lei });

    const data = record.data as Record<string, unknown>;
    const recAttrs = data?.attributes as Record<string, unknown>;
    const entity = recAttrs?.entity as Record<string, unknown>;
    const registration = recAttrs?.registration as Record<string, unknown>;
    const legalAddress = entity?.legalAddress as Record<string, unknown> | undefined;
    const relationships = data?.relationships as Record<string, unknown>;

    // Ultimate parent (best-effort)
    let ultimateParent: { lei: string; legalName: string; country: string } | undefined;
    const parentRelLink = (
      relationships?.["ultimate-parent-relationship"] as Record<string, unknown>
    )?.links as Record<string, string> | undefined;

    if (parentRelLink?.related) {
      const parentRel = await gleifFetch(parentRelLink.related);
      const parentRelData = parentRel?.data as Record<string, unknown> | undefined;
      const parentRelRels = parentRelData?.relationships as Record<string, unknown> | undefined;
      const parentNode = (
        parentRelRels?.["ultimate-parent"] as Record<string, unknown>
      )?.data as Record<string, unknown> | undefined;
      const parentLei = parentNode?.id as string | undefined;

      if (parentLei && parentLei !== lei) {
        const parentRecord = await gleifFetch(`https://api.gleif.org/api/v1/lei-records/${parentLei}`);
        const parentEntity = (
          (parentRecord?.data as Record<string, unknown>)?.attributes as Record<string, unknown>
        )?.entity as Record<string, unknown> | undefined;
        const parentAddr = parentEntity?.legalAddress as Record<string, unknown> | undefined;
        ultimateParent = {
          lei: parentLei,
          legalName: (parentEntity?.legalName as Record<string, string>)?.name ?? "",
          country: (parentAddr?.country as string) ?? "",
        };
      }
    }

    const addressLines = (legalAddress?.addressLines as string[]) ?? [];
    const addressParts = [
      ...addressLines,
      legalAddress?.city as string,
      legalAddress?.postalCode as string,
      legalAddress?.country as string,
    ].filter(Boolean);

    return Response.json({
      found: true,
      lei,
      legalName: matchedName ?? (entity?.legalName as Record<string, string>)?.name ?? name,
      status: (entity?.status as string) ?? "",
      jurisdiction: (entity?.jurisdiction as string) ?? "",
      country: (legalAddress?.country as string) ?? "",
      city: (legalAddress?.city as string) ?? "",
      address: addressParts.join(", "),
      registrationStatus: (registration?.status as string) ?? "",
      nextRenewalDate: (registration?.nextRenewalDate as string) ?? null,
      ultimateParent,
      gleifUrl: `https://search.gleif.org/#/record/${lei}`,
    });
  } catch (err) {
    console.error("GLEIF error:", err);
    return Response.json({ error: String(err), found: false }, { status: 502 });
  }
}
