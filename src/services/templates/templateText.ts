export interface NoteTemplate {
  id: string;
  name: string;
  description: string;
  extension: string;
  content: string;
}

export const MAX_USER_TEMPLATES = 30;
export const MAX_TEMPLATE_LENGTH = 20_000;

export const BUILT_IN_TEMPLATES: NoteTemplate[] = [
  {
    id: "meeting-notes",
    name: "Meeting notes",
    description: "Attendees, agenda, decisions and action items",
    extension: "md",
    content: `# Meeting notes — {{date}}

**Time:** {{time}}
**Attendees:**

## Agenda
1.

## Notes


## Decisions
-

## Action items
- [ ] Owner — task — due date
`,
  },
  {
    id: "todo-list",
    name: "To-do list",
    description: "Today, this week and later",
    extension: "md",
    content: `# To-do — {{date}}

## Today
- [ ]

## This week
- [ ]

## Later
- [ ]
`,
  },
  {
    id: "daily-journal",
    name: "Daily journal",
    description: "A short daily reflection",
    extension: "md",
    content: `# {{date}}

## How I feel


## What happened today


## Grateful for
1.

## Tomorrow I want to
-
`,
  },
  {
    id: "bug-report",
    name: "Bug report",
    description: "Steps, expected vs actual, environment",
    extension: "md",
    content: `# Bug: <short title>

**Reported:** {{date}} {{time}}

## Steps to reproduce
1.
2.
3.

## Expected result


## Actual result


## Environment
- Browser:
- Device / OS:
- Version:

## Notes / screenshots

`,
  },
  {
    id: "project-plan",
    name: "Project plan",
    description: "Goal, scope, milestones and risks",
    extension: "md",
    content: `# Project plan: <name>

**Created:** {{date}}

## Goal


## In scope
-

## Out of scope
-

## Milestones
| Milestone | Owner | Due |
|---|---|---|
|  |  |  |

## Risks
-
`,
  },
  {
    id: "blank-markdown",
    name: "Blank Markdown",
    description: "An empty Markdown note with a title",
    extension: "md",
    content: `# Untitled

`,
  },
];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Replaces {{date}} (YYYY-MM-DD) and {{time}} (HH:MM, 24-hour) with local values. */
export function fillPlaceholders(content: string, now: Date): string {
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  return content.replace(/\{\{\s*date\s*\}\}/gi, date).replace(/\{\{\s*time\s*\}\}/gi, time);
}

/**
 * A free name like "Meeting notes 2026-11-19.md", adding " (2)", " (3)"…
 * when that name is already taken in the folder.
 */
export function templateFileName(
  templateName: string,
  extension: string,
  now: Date,
  taken: ReadonlySet<string>,
): string {
  const base = `${templateName} ${fillPlaceholders("{{date}}", now)}`;
  const ext = extension.replace(/^\./, "") || "txt";
  let name = `${base}.${ext}`;
  for (let i = 2; taken.has(name.toLowerCase()); i++) name = `${base} (${i}).${ext}`;
  return name;
}

/** The extension of a file name, or "txt" when it has none. */
export function extensionOf(fileName: string): string {
  const match = /\.([A-Za-z0-9]+)$/.exec(fileName);
  return match ? match[1].toLowerCase() : "txt";
}
