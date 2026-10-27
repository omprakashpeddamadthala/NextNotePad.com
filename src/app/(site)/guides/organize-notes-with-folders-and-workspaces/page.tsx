import Link from "next/link";
import { ContentPage } from "@/components/site/ContentPage";
import { pageMetadata } from "@/lib/seo/site";

const PATH = "/guides/organize-notes-with-folders-and-workspaces";

export const metadata = pageMetadata(PATH);

export default function OrganizeNotesPage() {
  return (
    <ContentPage
      path={PATH}
      article
      heading="How to organize notes with folders and workspaces"
      intro={
        <p>
          Most note collections fail the same way: everything lands in one long
          list, and finding last month&apos;s meeting notes means scrolling. A
          little structure fixes that. This guide sets up a simple system in
          NextNotePad that stays tidy without much effort, and the same ideas
          work in any notes app.
        </p>
      }
      related={[
        "/guides/how-to-save-notes-online",
        "/features",
        "/keyboard-shortcuts",
      ]}
    >
      <h2>Step 1: Separate the big areas with workspaces</h2>
      <p>
        A workspace is a self-contained set of folders and files. Use one for
        each area that you rarely mix, for example:
      </p>
      <ul>
        <li>
          <strong>Work</strong>: projects, meetings, reference material.
        </li>
        <li>
          <strong>Personal</strong>: plans, lists, journaling.
        </li>
        <li>
          <strong>Study</strong>: one folder per course or subject.
        </li>
      </ul>
      <p>
        Switching workspaces changes everything you see in the file tree and
        search, so a work search never turns up your shopping list. Multiple
        workspaces need a Google sign-in, because each one is stored as its own
        folder in your Drive. Without an account you have one workspace, and
        folders (step 2) do the same job.
      </p>

      <h2>Step 2: Use a few broad folders, not many narrow ones</h2>
      <p>
        Deep folder trees feel organized but make you stop and decide where
        every note goes. A shallow structure is faster to file into and easier
        to scan. A layout that works for many people:
      </p>
      <ul>
        <li>
          <strong>Inbox</strong> for anything you have not sorted yet.
        </li>
        <li>
          <strong>Projects</strong>, with one subfolder per active project.
        </li>
        <li>
          <strong>Reference</strong> for things you look up: commands, how-tos,
          snippets.
        </li>
        <li>
          <strong>Archive</strong> for finished projects you might need again.
        </li>
      </ul>
      <p>
        Create a folder with <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>N</kbd>. When
        a project is done, move its folder to Archive instead of deleting it.
      </p>

      <h2>Step 3: Name files so they sort themselves</h2>
      <p>
        Put dates at the start in year-month-day order, such as{" "}
        <code>2026-10-27 team sync.md</code>. Files then sort in date order
        automatically. Give each file an extension that matches its content (
        <code>.md</code>, <code>.txt</code>, <code>.json</code>) so NextNotePad
        picks the right syntax highlighting.
      </p>

      <h2>Step 4: Let daily notes catch everything else</h2>
      <p>
        Not every thought deserves its own file. The <strong>daily note</strong>{" "}
        command opens a file named after today&apos;s date inside a{" "}
        <strong>Daily Notes</strong> folder, creating it if needed. Jot quick
        thoughts, to-dos and links there, and move anything worth keeping into a
        project folder at the end of the week.
      </p>

      <h2>Step 5: Find instead of browsing</h2>
      <p>
        Once notes are named sensibly, you rarely need to click through folders:
      </p>
      <ul>
        <li>
          <kbd>Ctrl</kbd>+<kbd>P</kbd> opens <strong>Quick Open</strong>: type
          part of a file name and press Enter.
        </li>
        <li>
          <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>F</kbd> runs{" "}
          <strong>Find in Files</strong> across the whole workspace, which is
          useful when you remember a phrase but not the file.
        </li>
        <li>
          Mark the handful of files you open every day as{" "}
          <strong>favorites</strong>, and use <strong>recent files</strong> to
          get back to what you were just working on.
        </li>
      </ul>

      <h2>Step 6: Clean up without fear</h2>
      <p>
        Deleted files and folders go to the <strong>recycle bin</strong>, so you
        can restore anything removed by mistake. Empty it when you are sure.
        Before a big reorganization, export a ZIP backup of the workspace from
        the Command Palette.
      </p>

      <h2>A five-minute weekly review</h2>
      <ol>
        <li>
          Empty the Inbox folder into the right project or reference folders.
        </li>
        <li>Skim the week&apos;s daily notes and move anything important.</li>
        <li>Move finished projects to Archive.</li>
        <li>Unfavorite files you no longer open every day.</li>
      </ol>
      <p>
        That is the whole system. For where these notes are physically stored
        and how to keep them safe, read{" "}
        <Link href="/guides/how-to-save-notes-online">
          How to save notes online
        </Link>
        .
      </p>
    </ContentPage>
  );
}
