"use client";

import { useMemo, useState } from "react";
import { X, Regex } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRegexTesterViewStore } from "@/store/regexTesterViewStore";
import { cn } from "@/lib/utils";

const FLAG_OPTIONS: { flag: string; label: string }[] = [
  { flag: "g", label: "Global" },
  { flag: "i", label: "Case-insensitive" },
  { flag: "m", label: "Multiline" },
  { flag: "s", label: "Dot-all" },
  { flag: "u", label: "Unicode" },
];

interface MatchInfo {
  match: string;
  index: number;
  groups: (string | undefined)[];
}

function getMatches(pattern: string, flags: string, testString: string): MatchInfo[] {
  const re = new RegExp(pattern, flags);
  const toInfo = (m: RegExpMatchArray): MatchInfo => ({
    match: m[0],
    index: m.index ?? 0,
    groups: m.slice(1),
  });
  if (flags.includes("g")) {
    return Array.from(testString.matchAll(re)).map(toInfo);
  }
  const m = re.exec(testString);
  return m ? [toInfo(m)] : [];
}

/** Renders the test string with every match highlighted — plain text segments interleaved with
 *  highlighted match segments, built from match indices rather than dangerouslySetInnerHTML. */
function HighlightedText({ text, matches }: { text: string; matches: MatchInfo[] }) {
  if (matches.length === 0) return <>{text}</>;
  const segments: { text: string; matched: boolean }[] = [];
  let cursor = 0;
  for (const m of matches) {
    if (m.index > cursor) segments.push({ text: text.slice(cursor, m.index), matched: false });
    segments.push({ text: m.match || " ", matched: true });
    cursor = m.index + (m.match.length || 1);
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), matched: false });

  return (
    <>
      {segments.map((s, i) =>
        s.matched ? (
          <mark key={i} className="rounded-sm bg-amber-300/60 text-inherit dark:bg-amber-500/40">
            {s.text}
          </mark>
        ) : (
          <span key={i}>{s.text}</span>
        ),
      )}
    </>
  );
}

/** Pattern + flags + test string, with live match highlighting and capture groups — same on-tab
 *  convention as Diff Checker. */
export function RegexTesterView() {
  const closeRegexTester = useRegexTesterViewStore((s) => s.closeRegexTester);

  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState("g");
  const [testString, setTestString] = useState("");

  function toggleFlag(flag: string) {
    setFlags((f) => (f.includes(flag) ? f.replace(flag, "") : f + flag));
  }

  const { matches, error } = useMemo(() => {
    if (!pattern) return { matches: [] as MatchInfo[], error: null as string | null };
    try {
      return { matches: getMatches(pattern, flags, testString), error: null };
    } catch (err) {
      return { matches: [] as MatchInfo[], error: err instanceof Error ? err.message : "Invalid pattern." };
    }
  }, [pattern, flags, testString]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-9 shrink-0 items-center gap-2 border-b bg-[var(--np-toolbar-bg)] px-2.5 text-sm">
        <Regex className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="font-medium">Regex Tester</span>
        <Button size="sm" variant="ghost" className="ml-auto" onClick={closeRegexTester}>
          <X className="size-3.5" /> Close
        </Button>
      </div>

      <div className="np-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
        <div>
          <p className="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">Pattern</p>
          <div className="flex items-center gap-2">
            <span className="font-mono text-muted-foreground">/</span>
            <Input
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="[a-z]+"
              className="h-8 flex-1 font-mono text-xs"
            />
            <span className="font-mono text-muted-foreground">/{flags}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {FLAG_OPTIONS.map(({ flag, label }) => (
              <Button
                key={flag}
                size="sm"
                variant={flags.includes(flag) ? "default" : "outline"}
                className="h-6 px-2 text-xs"
                onClick={() => toggleFlag(flag)}
                title={label}
              >
                {flag}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <p className="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">Test String</p>
          <Textarea
            value={testString}
            onChange={(e) => setTestString(e.target.value)}
            placeholder="Paste or type text to test the pattern against…"
            className="min-h-24 flex-1 resize-none font-mono text-xs"
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <p className="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {error ? "Error" : `Matches (${matches.length})`}
          </p>
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : (
            <div className="min-h-0 flex-1 space-y-3">
              {testString && (
                <div className="rounded-md border bg-muted/30 p-2 font-mono text-xs whitespace-pre-wrap">
                  <HighlightedText text={testString} matches={matches} />
                </div>
              )}
              {matches.length > 0 && (
                <div className="space-y-1.5">
                  {matches.map((m, i) => (
                    <div key={i} className={cn("rounded-md border p-2 text-xs")}>
                      <div className="font-mono">
                        <span className="text-muted-foreground">[{i}] @{m.index}:</span> {m.match}
                      </div>
                      {m.groups.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-muted-foreground">
                          {m.groups.map((g, gi) => (
                            <span key={gi} className="font-mono">
                              group {gi + 1}: {g ?? "—"}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
