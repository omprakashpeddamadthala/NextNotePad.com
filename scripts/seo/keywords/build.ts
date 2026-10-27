/**
 * Turns cached autocomplete suggestions into the keyword dataset:
 *   docs/seo/keywords.csv               every relevant keyword, classified and mapped
 *   docs/seo/data/autocomplete-raw.csv  provenance: every suggestion and the query that found it
 *   docs/seo/keyword-clusters.md        cluster -> URL summary with top keywords
 *
 *   npx tsx scripts/seo/keywords/build.ts [locales...]
 *
 * Search volume and difficulty are "unknown" unless docs/seo/data/volumes.csv
 * exists (columns: keyword,volume,difficulty,source,date), e.g. exported from
 * Google Keyword Planner or Search Console. Nothing here invents numbers.
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { CACHE_DIR, readCache, type CachedResponse } from "./collect";
import { HOME_PAGE, SITE_PAGES } from "../../../src/lib/seo/site";

const OUT_DIR = path.join(process.cwd(), "docs/seo");
const DATA_DIR = path.join(OUT_DIR, "data");

type Intent = "informational" | "navigational" | "commercial" | "transactional";
type Relevance = "high" | "medium" | "low";

interface Mapping {
  cluster: string;
  url: string;
  status: "existing" | "proposed";
}

interface Row {
  keyword: string;
  normalized: string;
  category: string;
  intent: Intent;
  country: string;
  language: string;
  volume: string;
  difficulty: string;
  metricsSource: string;
  serpType: string;
  relevance: Relevance;
  relevanceNote: string;
  cluster: string;
  targetUrl: string;
  urlStatus: string;
  role: "primary" | "secondary" | "supporting";
  bestPosition: number;
  appearances: number;
  priority: number;
  action: string;
  source: string;
  collectedAt: string;
  discoveryQuery: string;
}

export function normalize(keyword: string): string {
  return keyword
    .toLowerCase()
    .replace(/[^\p{L}\p{N}+#.\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ---------------------------------------------------------------- relevance

/** Physical stationery, word meanings and other off-topic senses of "notepad". */
const OFF_TOPIC =
  /\b(paper|printable|printed|printing|print|custom|personali[sz]ed|bulk|wholesale|leather|spiral|holder|magnetic|logo|stationery|staples|walmart|amazon|flipkart|etsy|dollar tree|a4|a5|lined|refill|cover|clipart|png|svg|vector|icon|mockup|meme|keychain|meaning|definition|synonym|translate|jobs?|salary|stock|minecraft|roblox|game|gift|gifts|cute|wedding|funny|price|cost|shop|buy|yellow|pink|blue|green|red|black|purple|yahoo|virus|malware|hack|hacks|trick|tricks|prank|batch file|bat file|cmd|command prompt)\b/;

/** Things people want that NextNotePad does not do; never promise these. */
const UNSUPPORTED =
  /\b(share|shareable|sharing|shared|collaborat\w*|real ?time|together|multiple users|multi ?user|publish|public|custom url|url|link|draw|drawing|pen|handwrit\w*|stylus|sketch|scribble|whiteboard|image|images|picture|photo|pdf|excel|spreadsheet|docx|ms word|microsoft word|like word|to word|rich text|reminder|alarm|calendar|sticky|widget|transcri\w*|ai note taker|meeting recorder|chat|email|sms|anonymous|paste ?bin|pastebin|extension|add ?on|addon|bold|italic|underline|bullets?|bullet points|fonts?|compiler|compile|run code|execute|ide|free ?hand)\b/;

const TOPIC =
  /(note|notes|notepad|note pad|notebook|text|editor|scratch ?pad|txt|writ|journal|diary|markdown|json|diff|compare|base64|keep|onenote|evernote|simplenote|notion|sublime|memo|to ?do|checklist|textedit|wordpad)/;

// "notepad++" ends in "+", so \b cannot bound it; match on whitespace/edges instead.
const COMPETITORS =
  /(?:^|\s)(notepad ?\+\+|notepad plus plus|google keep|onenote|one note|evernote|simplenote|notion|sublime(?: text)?|protectedtext|obsidian|joplin|apple notes|standard notes|textedit|wordpad|vs ?code|visual studio code|vim|emacs|gedit|notepad\.exe|windows notepad|ulysses|dropbox paper)(?=$|\s)/;

const ALT_MODIFIER =
  /\b(alternative|alternatives|vs|versus|like|similar|instead|replacement|online|web|browser|for mac|mac|macbook|linux|ubuntu|chromebook|chrome ?os|ipad|iphone|android)\b/;

/** Typing in a non-Latin script usually means a transliteration tool, which this is not. */
const LANGUAGE_TYPING =
  /\b(hindi|marathi|kannada|tamil|telugu|bengali|bangla|gujarati|urdu|punjabi|malayalam|nepali|sinhala|arabic|persian|farsi|chinese|japanese|korean|russian|thai|amharic)\b/;

/** Signals that the searcher wants a web notepad / editor / notes tool. */
const STRONG_INTENT =
  /\b(online|web|browser|internet|cloud|free|no login|no sign ?up|without (login|account|sign ?up|signing)|text editor|code editor|editor|note ?taking|notes? app|app|notes online|save|saves|saving|scratch ?pad|write|writing|tabs|autosave|auto save|private|secure|encrypt\w*|password|markdown|json|diff|syntax|tool|tools|notes)\b/;

function relevanceOf(n: string): { relevance: Relevance | null; note: string } {
  if (/next ?notepad/.test(n)) return { relevance: "high", note: "brand" };
  if (OFF_TOPIC.test(n)) return { relevance: null, note: "off-topic" };
  if (!TOPIC.test(n)) return { relevance: null, note: "no topic term" };
  if (UNSUPPORTED.test(n))
    return {
      relevance: "low",
      note: "asks for a feature NextNotePad does not have",
    };
  if (
    /(?:^|\s)(io|org|net|com|co|pw|cc|me)$/.test(n) ||
    /\.(com|org|net|io|pw|cc|me)\b/.test(n)
  ) {
    return { relevance: "low", note: "refers to another website by name" };
  }
  const competitor = n.match(COMPETITORS)?.[1];
  if (competitor) {
    if (!ALT_MODIFIER.test(n))
      return {
        relevance: "low",
        note: `support or navigational query for ${competitor}`,
      };
    if (
      /notepad ?\+\+|notepad plus plus/.test(competitor) &&
      /\b(alternative|alternatives|online|web|browser)\b/.test(n)
    ) {
      return { relevance: "high", note: "Notepad++ alternative intent" };
    }
    return {
      relevance: "medium",
      note: `alternative/comparison intent for ${competitor}`,
    };
  }
  if (LANGUAGE_TYPING.test(n))
    return {
      relevance: "medium",
      note: "non-English typing intent; no transliteration",
    };
  if (STRONG_INTENT.test(n)) return { relevance: "high", note: "" };
  if (/^(notepad|note pad)\b/.test(n)) {
    return {
      relevance: "low",
      note: "ambiguous: likely Windows Notepad or a paper notepad",
    };
  }
  return { relevance: "medium", note: "" };
}

// ------------------------------------------------------------------ intent

function intentOf(n: string): Intent {
  if (/next ?notepad/.test(n) || /\.(com|org|net|io)\b/.test(n))
    return "navigational";
  if (
    /\b(login|log in|sign in|download|portable|github|plugin|plugins)\b/.test(
      n,
    ) &&
    COMPETITORS.test(n)
  ) {
    return "navigational";
  }
  if (
    /^(how|what|why|where|when|can|is|are|does|do|which|should|who)\b/.test(n)
  )
    return "informational";
  if (
    /\b(guide|tutorial|tips|ideas|examples?|meaning|template|method|methods|system)\b/.test(
      n,
    )
  )
    return "informational";
  if (
    /\b(best|top|vs|versus|alternative|alternatives|compare|comparison|review|reviews|like|similar)\b/.test(
      n,
    )
  ) {
    return "commercial";
  }
  return "transactional";
}

// ----------------------------------------------------------------- mapping

const RULES: [RegExp, Mapping][] = [
  [/next ?notepad/, { cluster: "brand", url: "/", status: "existing" }],
  [
    /(notepad\+\+|notepad plus plus|notepad pp)/,
    {
      cluster: "notepad++ alternative",
      url: "/notepad-plus-plus-alternative",
      status: "existing",
    },
  ],
  [
    /\b(shortcut|shortcuts|hotkey|hotkeys|keyboard)\b/,
    { cluster: "shortcuts", url: "/keyboard-shortcuts", status: "existing" },
  ],
  [
    /\b(private|privacy|secure|security|encrypt\w*|password|protected|lock|locked|safe|secret)\b/,
    { cluster: "privacy & security", url: "/security", status: "existing" },
  ],
  [
    /\b(auto ?save|autosave|tabs?|dark mode|theme|themes|syntax|highlight\w*|word wrap|line numbers?|encoding|utf|voice|dictation|speech|install|pwa)\b/,
    { cluster: "features", url: "/features", status: "existing" },
  ],
  [
    /\b(save|saves|saving|saved|store|storage|backup|back up|sync|google drive|drive|cloud|across devices|all devices)\b/,
    {
      cluster: "save notes online",
      url: "/guides/how-to-save-notes-online",
      status: "existing",
    },
  ],
  [
    /\b(organi[sz]\w*|folders?|workspaces?|categor\w*|tags?)\b/,
    {
      cluster: "organize notes",
      url: "/guides/organize-notes-with-folders-and-workspaces",
      status: "existing",
    },
  ],
  [
    /\b(google keep|onenote|one note|evernote|simplenote|notion|sublime|protectedtext|obsidian|joplin|apple notes|standard notes|textedit|wordpad|windows notepad|notepad\.exe|vs ?code)\b/,
    {
      cluster: "competitor alternatives",
      url: "/alternatives",
      status: "proposed",
    },
  ],
  [
    /\b(diff|difference|compare|comparison|comparer)\b/,
    { cluster: "diff checker", url: "/diff-checker", status: "proposed" },
  ],
  [
    /\bjson\b/,
    { cluster: "json formatter", url: "/json-formatter", status: "proposed" },
  ],
  [
    /\b(markdown|md)\b/,
    { cluster: "markdown editor", url: "/markdown-editor", status: "proposed" },
  ],
  [
    /\b(code|coding|programming|programmer|developer|developers|html|css|javascript|js|python|sql|xml|yaml|base64|hash|sha|encode|decode|encoder|decoder|regex|uuid|jwt|uppercase|lowercase|case converter)\b/,
    { cluster: "developers", url: "/developers", status: "existing" },
  ],
  [
    /\b(students?|study|school|class|college|university|lecture|exam|homework)\b/,
    { cluster: "students", url: "/for/students", status: "proposed" },
  ],
  [
    /\b(meeting|meetings|work|office|business|minutes|agenda|team)\b/,
    {
      cluster: "meeting & work notes",
      url: "/for/meeting-notes",
      status: "proposed",
    },
  ],
  [
    /\b(journal|journaling|diary|daily|writing|writer|writers|novel|story|poem|poetry|blog)\b/,
    {
      cluster: "writing & journaling",
      url: "/for/writing",
      status: "proposed",
    },
  ],
  [
    /\b(to ?do|todo|checklist|task|tasks|list|lists)\b/,
    { cluster: "to-do lists", url: "/for/to-do-lists", status: "proposed" },
  ],
  [
    /\b(offline|without internet|no internet)\b/,
    { cluster: "offline", url: "/faq", status: "existing" },
  ],
  [
    /\b(mac|macbook|macos|chromebook|chrome ?os|linux|ubuntu|ipad|iphone|android|ios|windows ?(10|11)?|chrome|firefox|safari|edge)\b/,
    { cluster: "devices & platforms", url: "/devices", status: "proposed" },
  ],
  [
    /\b(scratch ?pad|scratch|quick|temporary|temp|instant|simple|minimal|clean|distraction|blank)\b/,
    { cluster: "online notepad (core)", url: "/", status: "existing" },
  ],
];

function mappingOf(n: string): Mapping {
  for (const [re, mapping] of RULES) if (re.test(n)) return mapping;
  return { cluster: "online notepad (core)", url: "/", status: "existing" };
}

// ---------------------------------------------------------------- metrics

interface Metrics {
  volume: number;
  difficulty: string;
  source: string;
  date: string;
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out;
}

function loadMetrics(): Map<string, Metrics> {
  const file = path.join(DATA_DIR, "volumes.csv");
  const metrics = new Map<string, Metrics>();
  if (!existsSync(file)) return metrics;
  const [header, ...lines] = readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter(Boolean);
  const cols = parseCsvLine(header).map((c) => c.trim().toLowerCase());
  for (const line of lines) {
    const cells = parseCsvLine(line);
    const get = (name: string) => cells[cols.indexOf(name)]?.trim() ?? "";
    const volume = Number(get("volume").replace(/,/g, ""));
    if (!get("keyword") || Number.isNaN(volume)) continue;
    metrics.set(normalize(get("keyword")), {
      volume,
      difficulty: get("difficulty") || "unknown",
      source: get("source") || "volumes.csv",
      date: get("date") || "unknown",
    });
  }
  return metrics;
}

// ---------------------------------------------------------------- scoring

const PRIMARY = new Map<string, string>([
  [HOME_PAGE.primaryKeyword, HOME_PAGE.path],
  ...SITE_PAGES.map((p) => [p.primaryKeyword, p.path] as [string, string]),
]);

interface Popularity {
  /** Best (lowest) position in any autocomplete list, 0-based. */
  bestPosition: number;
  /** Number of distinct discovery queries that surfaced the keyword. */
  appearances: number;
}

/**
 * 0-100 score from relevance, intent and URL fit, plus two observable
 * popularity proxies from autocomplete (list position and how many different
 * queries surfaced it). Real volume, when supplied, adds up to 15 points.
 */
function priorityOf(
  row: Pick<Row, "relevance" | "intent" | "urlStatus" | "normalized">,
  popularity: Popularity,
  volume?: number,
): number {
  let score = { high: 45, medium: 25, low: 5 }[row.relevance];
  score += {
    transactional: 15,
    commercial: 12,
    informational: 8,
    navigational: 0,
  }[row.intent];
  if (row.intent === "navigational" && /next ?notepad/.test(row.normalized))
    score += 30;
  if (row.urlStatus === "existing") score += 8;
  const words = row.normalized.split(" ").length;
  if (words >= 2 && words <= 4) score += 4;
  if (words >= 7) score -= 4;
  if (popularity.bestPosition <= 2) score += 10;
  else if (popularity.bestPosition <= 5) score += 5;
  score += Math.min(8, (popularity.appearances - 1) * 2);
  if (volume !== undefined && volume > 0)
    score += Math.min(15, Math.round(Math.log10(volume) * 5));
  return Math.max(0, Math.min(100, score));
}

function actionOf(
  row: Pick<
    Row,
    "relevance" | "relevanceNote" | "role" | "urlStatus" | "targetUrl"
  >,
): string {
  if (row.relevanceNote.startsWith("asks for a feature"))
    return "Do not target: the product lacks this feature";
  if (row.relevanceNote.startsWith("support or navigational"))
    return "Skip: support query for another product";
  if (row.role === "primary")
    return "Primary target: track ranking for this URL";
  if (row.urlStatus === "proposed")
    return `Content gap: evidence for proposed page ${row.targetUrl}`;
  if (row.relevance === "low") return "Monitor only";
  return "Cover naturally in the target page's copy, an H2 or an FAQ answer";
}

// ------------------------------------------------------------------- build

const csvCell = (value: string | number) =>
  `"${String(value).replace(/"/g, '""')}"`;

function main() {
  const locales = process.argv.slice(2).length
    ? process.argv.slice(2)
    : existsSync(CACHE_DIR)
      ? readdirSync(CACHE_DIR)
      : [];
  const responses: CachedResponse[] = locales.flatMap((locale) =>
    readCache(locale),
  );
  if (responses.length === 0) {
    console.error("No cached suggestions. Run collect.ts first.");
    process.exit(1);
  }

  const metrics = loadMetrics();
  const rows = new Map<string, Row>();
  const raw: string[] = [
    [
      "suggestion",
      "discovery_query",
      "seed",
      "category",
      "locale",
      "collected_at",
    ].join(","),
  ];
  const popularity = new Map<
    string,
    { bestPosition: number; queries: Set<string> }
  >();
  let dropped = 0;

  for (const response of responses) {
    for (const [position, suggestion] of response.suggestions.entries()) {
      raw.push(
        [
          suggestion,
          response.query,
          response.seed,
          response.category,
          response.locale,
          response.collectedAt,
        ]
          .map(csvCell)
          .join(","),
      );
      const normalized = normalize(suggestion);
      const key = `${response.locale}|${normalized}`;
      if (!normalized) continue;
      const seen = popularity.get(key);
      if (seen) {
        seen.bestPosition = Math.min(seen.bestPosition, position);
        seen.queries.add(response.query);
        continue;
      }
      popularity.set(key, {
        bestPosition: position,
        queries: new Set([response.query]),
      });

      const { relevance, note } = relevanceOf(normalized);
      if (!relevance) {
        dropped++;
        continue;
      }
      const mapping = mappingOf(normalized);
      const intent = intentOf(normalized);
      const m = metrics.get(normalized);
      const primaryFor = PRIMARY.get(normalized);
      const role: Row["role"] =
        primaryFor === mapping.url || (primaryFor && relevance === "high")
          ? "primary"
          : relevance === "high" &&
              mapping.status === "existing" &&
              normalized.split(" ").length <= 4
            ? "secondary"
            : "supporting";
      const targetUrl = primaryFor ?? mapping.url;

      const row: Row = {
        keyword: suggestion,
        normalized,
        category: response.category,
        intent,
        country: response.locale.toUpperCase(),
        language: "en",
        volume: m ? String(m.volume) : "unknown",
        difficulty: m ? m.difficulty : "unknown",
        metricsSource: m ? `${m.source} (${m.date})` : "none",
        serpType: "not analyzed",
        relevance,
        relevanceNote: note,
        cluster: mapping.cluster,
        targetUrl,
        urlStatus: primaryFor ? "existing" : mapping.status,
        role,
        bestPosition: 0,
        appearances: 0,
        priority: 0,
        action: "",
        source: "Google Autocomplete",
        collectedAt: response.collectedAt.slice(0, 10),
        discoveryQuery: response.query,
      };
      rows.set(key, row);
    }
  }

  for (const [key, row] of rows) {
    const seen = popularity.get(key)!;
    row.bestPosition = seen.bestPosition;
    row.appearances = seen.queries.size;
    const volume = row.volume === "unknown" ? undefined : Number(row.volume);
    row.priority = priorityOf(
      row,
      { bestPosition: row.bestPosition, appearances: row.appearances },
      volume,
    );
    row.action = actionOf(row);
  }

  const sorted = [...rows.values()].sort(
    (a, b) =>
      b.priority - a.priority || a.normalized.localeCompare(b.normalized),
  );

  mkdirSync(DATA_DIR, { recursive: true });
  const header = [
    "keyword",
    "normalized_keyword",
    "seed_category",
    "search_intent",
    "country",
    "language",
    "monthly_search_volume",
    "keyword_difficulty",
    "metrics_source",
    "serp_dominant_content_type",
    "relevance",
    "relevance_note",
    "cluster",
    "target_url",
    "url_status",
    "keyword_role",
    "autocomplete_best_position",
    "autocomplete_appearances",
    "priority_score",
    "recommended_action",
    "source",
    "collected_on",
    "discovery_query",
  ];
  const csv = [
    header.join(","),
    ...sorted.map((r) =>
      [
        r.keyword,
        r.normalized,
        r.category,
        r.intent,
        r.country,
        r.language,
        r.volume,
        r.difficulty,
        r.metricsSource,
        r.serpType,
        r.relevance,
        r.relevanceNote,
        r.cluster,
        r.targetUrl,
        r.urlStatus,
        r.role,
        r.bestPosition + 1,
        r.appearances,
        r.priority,
        r.action,
        r.source,
        r.collectedAt,
        r.discoveryQuery,
      ]
        .map(csvCell)
        .join(","),
    ),
  ];
  writeFileSync(path.join(OUT_DIR, "keywords.csv"), csv.join("\n") + "\n");
  writeFileSync(
    path.join(DATA_DIR, "autocomplete-raw.csv"),
    raw.join("\n") + "\n",
  );
  writeFileSync(
    path.join(OUT_DIR, "keyword-clusters.md"),
    clusterReport(sorted, responses, dropped),
  );

  const by = (f: (r: Row) => string) =>
    Object.entries(
      sorted.reduce<Record<string, number>>(
        (acc, r) => ((acc[f(r)] = (acc[f(r)] ?? 0) + 1), acc),
        {},
      ),
    )
      .map(([k, v]) => `${k}=${v}`)
      .join(", ");
  console.log(
    `${responses.length} cached responses, ${raw.length - 1} raw suggestions`,
  );
  console.log(
    `${sorted.length} unique relevant keywords (${dropped} off-topic dropped)`,
  );
  console.log(`relevance: ${by((r) => r.relevance)}`);
  console.log(`intent: ${by((r) => r.intent)}`);
}

function clusterReport(
  rows: Row[],
  responses: CachedResponse[],
  dropped: number,
): string {
  const dates = responses.map((r) => r.collectedAt.slice(0, 10)).sort();
  const clusters = new Map<string, Row[]>();
  for (const row of rows) {
    const list = clusters.get(row.cluster) ?? [];
    list.push(row);
    clusters.set(row.cluster, list);
  }
  const ordered = [...clusters.entries()].sort(
    (a, b) => b[1].length - a[1].length,
  );

  const lines = [
    "# Keyword clusters and URL mapping",
    "",
    "Generated by `scripts/seo/keywords/build.ts` from `docs/seo/keywords.csv`. Do not edit by hand.",
    "",
    `- Source: Google Autocomplete suggestions, collected ${dates[0]} to ${dates.at(-1)} (${[...new Set(responses.map((r) => r.locale))].join(", ")}).`,
    `- ${rows.length} unique relevant keywords; ${dropped} off-topic suggestions removed (stationery, word meanings, etc.).`,
    "- Search volume and difficulty: **unknown** unless listed in `docs/seo/data/volumes.csv`. Suggestions prove people search a phrase, not how often.",
    "",
    "| Cluster | Target URL | Status | Keywords | High relevance |",
    "|---|---|---|---:|---:|",
    ...ordered.map(
      ([cluster, list]) =>
        `| ${cluster} | \`${list[0].targetUrl}\` | ${list[0].urlStatus} | ${list.length} | ${list.filter((r) => r.relevance === "high").length} |`,
    ),
    "",
  ];
  for (const [cluster, list] of ordered) {
    lines.push(`## ${cluster}`, "");
    lines.push(
      `Top keywords by priority (of ${list.length}): ` +
        list
          .slice(0, 15)
          .map((r) => `\`${r.normalized}\``)
          .join(", "),
      "",
    );
  }
  return lines.join("\n");
}

main();
