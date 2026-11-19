import Link from "next/link";
import {
  Cloud,
  FileCode2,
  FolderTree,
  LockKeyhole,
  Search,
  Zap,
} from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { HOME_FAQ } from "@/lib/seo/homeFaq";
import { faqJsonLd } from "@/lib/seo/jsonLd";

const FEATURES = [
  {
    icon: Zap,
    title: "Start in one click",
    text: "No download and no sign-up. The editor opens straight away and autosaves while you type.",
  },
  {
    icon: FolderTree,
    title: "Tabs, folders and workspaces",
    text: "Keep many notes open in tabs, group them in folders, and switch between separate workspaces after signing in.",
  },
  {
    icon: Cloud,
    title: "Your notes, your Google Drive",
    text: "Sign in with Google and notes are saved as real files in your own Drive, not on our servers.",
  },
  {
    icon: FileCode2,
    title: "A real code editor",
    text: "Built on Monaco, the editor behind VS Code, with syntax highlighting for 30 languages, formatters and a diff checker.",
  },
  {
    icon: Search,
    title: "Find anything fast",
    text: "Find and replace, find in files, Quick Open and a Command Palette, all from the keyboard.",
  },
  {
    icon: LockKeyhole,
    title: "Private by design",
    text: "Lock any note with a passphrase. It is encrypted with AES-256 in your browser before it is stored.",
  },
];

const SAVE_OPTIONS = [
  {
    title: "No account",
    text: "Notes stay in this browser on this device. Nothing is uploaded. Clearing site data removes them, so export a ZIP backup now and then.",
  },
  {
    title: "Sign in with Google",
    text: "Notes become files in a NextNotePad.com folder in your Drive and open on any device you sign in on. The app can only see files it created.",
  },
  {
    title: "ZIP backup",
    text: "Export a whole workspace as a ZIP file at any time, and import it again later, in either mode.",
  },
];

/**
 * Server-rendered text shown below the editor on "/". It gives visitors (and
 * search engines) a plain description of the product without changing the
 * editor in the first screen. Must stay genuinely visible: never hide it.
 */
export function HomeContent() {
  return (
    <main id="about" className="bg-white text-slate-700">
      <JsonLd data={faqJsonLd(HOME_FAQ)} />

      <section className="mx-auto max-w-5xl px-4 pt-16 sm:px-6 sm:pt-24">
        <p className="text-sm font-medium tracking-wide text-indigo-600 uppercase">
          About NextNotePad
        </p>
        <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-balance text-slate-900 sm:text-5xl">
          A free online notepad that keeps your notes yours
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
          NextNotePad is a fast text editor that runs in your browser. Write
          notes, to-do lists, code snippets or drafts with no install and no
          account. When you want your notes on every device, sign in with Google
          and they are saved as plain files in your own Google Drive.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a
            href="#editor-main"
            className="rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            Start writing
          </a>
          <Link
            href="/features"
            className="rounded-md px-4 py-2.5 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition-colors ring-inset hover:bg-slate-50"
          >
            See all features
          </Link>
        </div>
      </section>

      <section
        aria-labelledby="home-features"
        className="mx-auto max-w-5xl px-4 pt-20 sm:px-6"
      >
        <h2
          id="home-features"
          className="text-2xl font-semibold tracking-tight text-slate-900"
        >
          Why people use NextNotePad
        </h2>
        <ul className="mt-8 grid gap-px overflow-hidden rounded-xl bg-slate-200 ring-1 ring-slate-200 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="bg-white p-6">
              <Icon className="size-5 text-indigo-600" aria-hidden="true" />
              <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="home-saving"
        className="mx-auto max-w-5xl px-4 pt-20 sm:px-6"
      >
        <h2
          id="home-saving"
          className="text-2xl font-semibold tracking-tight text-slate-900"
        >
          How your notes are saved
        </h2>
        <p className="mt-4 max-w-2xl leading-7 text-slate-600">
          Most online notepads either keep notes in one browser or store them on
          their own servers. NextNotePad lets you choose.
        </p>
        <ol className="mt-8 grid gap-6 sm:grid-cols-3">
          {SAVE_OPTIONS.map((option, i) => (
            <li key={option.title} className="border-t border-slate-200 pt-5">
              <span className="font-mono text-xs text-slate-400">0{i + 1}</span>
              <h3 className="mt-2 font-semibold text-slate-900">
                {option.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {option.text}
              </p>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-sm text-slate-600">
          Step-by-step instructions are in the{" "}
          <Link
            href="/guides/how-to-save-notes-online"
            className="text-indigo-700 underline hover:text-indigo-900"
          >
            guide to saving notes online
          </Link>
          , and the details of what the app can access are on the{" "}
          <Link
            href="/security"
            className="text-indigo-700 underline hover:text-indigo-900"
          >
            privacy and security page
          </Link>
          .
        </p>
      </section>

      <section
        aria-labelledby="home-choosing"
        className="mx-auto max-w-5xl px-4 pt-20 sm:px-6"
      >
        <div className="rounded-xl bg-slate-50 p-6 ring-1 ring-slate-200 sm:p-8">
          <h2
            id="home-choosing"
            className="text-2xl font-semibold tracking-tight text-slate-900"
          >
            Looking for the best online notepad?
          </h2>
          <p className="mt-4 max-w-2xl leading-7 text-slate-600">
            The right one depends on what you need: a quick scratch pad, notes
            you can share by link, an app with reminders, or a real editor for
            longer work. Our comparison sets out where NextNotePad fits, and
            where another tool is the better choice.
          </p>
          <Link
            href="/best-online-notepad"
            className="mt-6 inline-block text-sm font-medium text-indigo-700 underline hover:text-indigo-900"
          >
            Compare online notepads
          </Link>
        </div>
      </section>

      <section
        aria-labelledby="home-faq"
        className="mx-auto max-w-5xl px-4 pt-20 sm:px-6"
      >
        <h2
          id="home-faq"
          className="text-2xl font-semibold tracking-tight text-slate-900"
        >
          Common questions
        </h2>
        <dl className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
          {HOME_FAQ.map((item) => (
            <div
              key={item.question}
              className="py-5 sm:grid sm:grid-cols-3 sm:gap-6"
            >
              <dt className="font-semibold text-slate-900">{item.question}</dt>
              <dd className="mt-2 leading-7 text-slate-600 sm:col-span-2 sm:mt-0">
                {item.answer}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-sm text-slate-600">
          More answers are on the{" "}
          <Link
            href="/faq"
            className="text-indigo-700 underline hover:text-indigo-900"
          >
            FAQ page
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
