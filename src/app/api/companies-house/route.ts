// UK Companies House API integration
// Free API key at https://developer.company-information.service.gov.uk/
// Requires COMPANIES_HOUSE_API_KEY env var
//
// Search strategy:
//   1. Full name as supplied
//   2. Name with corporate suffixes stripped (Industries, Technologies, Group, etc.)
//   3. First significant word only
// Always prefers active companies over dissolved ones.

// Corporate suffixes to strip for fallback searches
const STRIP_SUFFIXES =
  /\b(industries|technologies|technology|group|solutions|systems|international|holding|holdings|corporation|enterprises|manufacturing|automotive|global|europe|european|ag|bv|spa|plc|ltd|limited)\b/gi;

// Known UK search overrides for suppliers whose trading name differs from the
// registered UK entity name.  Key = lowercased display name.
const NAME_OVERRIDES: Record<string, string> = {
  "db schenker":         "schenker",
  "ebm-papst":           "ebmpapst",
  "georg fischer":       "georg fischer piping",
  "sit group":           "sit italy",
  "sensata technologies":"sensata technologies",
};

function searchTerms(name: string): string[] {
  const lower = name.toLowerCase().trim();
  const terms: string[] = [];

  // 0. Known override
  if (NAME_OVERRIDES[lower]) terms.push(NAME_OVERRIDES[lower]);

  // 1. Full name
  terms.push(name.trim());

  // 2. Stripped name
  const stripped = name.replace(STRIP_SUFFIXES, "").replace(/\s+/g, " ").trim();
  if (stripped && stripped !== name.trim()) terms.push(stripped);

  // 3. First significant word (length > 3)
  const words = name.split(/\s+/).filter((w) => w.length > 3);
  if (words[0] && words[0] !== stripped) terms.push(words[0]);

  // Deduplicate, preserve order
  return [...new Set(terms)];
}

type CHItem = Record<string, unknown>;

async function searchCompanies(
  term: string,
  authHeader: string
): Promise<CHItem[]> {
  const url = `https://api.company-information.service.gov.uk/search/companies?q=${encodeURIComponent(term)}&items_per_page=10`;
  const res = await fetch(url, { headers: { Authorization: authHeader } });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.items ?? []) as CHItem[];
}

function pickBest(items: CHItem[]): CHItem | null {
  if (items.length === 0) return null;
  // Prefer active companies
  const active = items.filter((i) => i.company_status === "active");
  return active[0] ?? items[0];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");
  const supplierId = searchParams.get("id") ?? "";

  if (!name) {
    return Response.json({ error: "name param required" }, { status: 400 });
  }

  const apiKey = process.env.COMPANIES_HOUSE_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "COMPANIES_HOUSE_API_KEY not configured", noKey: true },
      { status: 503 }
    );
  }

  const authHeader = "Basic " + Buffer.from(apiKey + ":").toString("base64");

  try {
    // Try each search term in order until we find an active match
    let company: CHItem | null = null;
    const terms = searchTerms(name);

    for (const term of terms) {
      const items = await searchCompanies(term, authHeader);
      company = pickBest(items);
      if (company) break;
    }

    if (!company) {
      return Response.json({
        found: false,
        name,
        searched: terms,
        note: "No UK-registered entity found. This supplier may only have non-UK entities.",
      });
    }

    const companyNumber = company.company_number as string;

    // Fetch filing history (accounts) and company profile in parallel
    const [filingRes, profileRes] = await Promise.all([
      fetch(
        `https://api.company-information.service.gov.uk/company/${companyNumber}/filing-history?category=accounts&items_per_page=5`,
        { headers: { Authorization: authHeader } }
      ),
      fetch(
        `https://api.company-information.service.gov.uk/company/${companyNumber}`,
        { headers: { Authorization: authHeader } }
      ),
    ]);

    const filings: Record<string, unknown>[] = filingRes.ok
      ? ((await filingRes.json()).items ?? []).map((f: Record<string, unknown>) => ({
          date: f.date,
          description: f.description,
          type: f.type,
        }))
      : [];

    const profile: Record<string, unknown> = profileRes.ok
      ? await profileRes.json()
      : {};

    const accounts = profile.accounts as Record<string, unknown> | undefined;
    const lastAccounts = accounts?.last_accounts as Record<string, string> | undefined;
    const confirmationStatement = profile.confirmation_statement as Record<string, unknown> | undefined;

    return Response.json({
      found: true,
      companyNumber,
      companyName: company.title,
      status: company.company_status,
      type: company.company_type,
      incorporatedOn: (company.date_of_creation as string) ?? null,
      address: company.address_snippet ?? null,
      sicCodes: (profile.sic_codes as string[]) ?? [],
      accountsLastMadeUpTo: lastAccounts?.made_up_to ?? null,
      accountsNextDue: (accounts?.next_due as string) ?? null,
      confirmationStatementNextDue: (confirmationStatement?.next_due as string) ?? null,
      recentFilings: filings.slice(0, 3),
      companiesHouseUrl: `https://find-and-update.company-information.service.gov.uk/company/${companyNumber}`,
      searchedAs: terms[0],
    });
  } catch (err) {
    console.error("Companies House error:", err);
    return Response.json({ error: String(err), found: false }, { status: 502 });
  }
}
