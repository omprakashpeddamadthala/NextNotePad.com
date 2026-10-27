import Link from "next/link";
import { ContentPage } from "@/components/site/ContentPage";
import { pageMetadata } from "@/lib/seo/site";

const PATH = "/features";

export const metadata = pageMetadata(PATH);

export default function FeaturesPage() {
  return (
    <ContentPage
      path={PATH}
      heading="NextNotePad features"
      intro={
        <p>
          NextNotePad is a free notepad and text editor that runs in your
          browser. Here is everything it can do today, including which features
          need a Google sign-in and which work without an account.
        </p>
      }
      related={["/security", "/developers", "/keyboard-shortcuts"]}
    >
      <h2>Writing and editing</h2>
      <p>
        The editor is built on Monaco, the same editing engine used by Visual
        Studio Code. That means familiar behavior for anyone who has used a
        modern code editor, including multiple cursors, bracket matching and
        undo history per file.
      </p>
      <ul>
        <li>
          <strong>Tabs.</strong> Open as many notes as you need side by side in
          tabs, reorder them, and reopen a tab you closed by accident with{" "}
          <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>T</kbd>.
        </li>
        <li>
          <strong>Split editor.</strong> View two files, or two parts of the
          same file, next to each other.
        </li>
        <li>
          <strong>Autosave.</strong> Changes are saved automatically every 2, 5
          or 10 seconds (5 seconds by default). You can also switch to manual
          saving with <kbd>Ctrl</kbd>+<kbd>S</kbd>.
        </li>
        <li>
          <strong>Syntax highlighting for 30 languages,</strong> including plain
          text, Markdown, JSON, YAML, XML, HTML, CSS, JavaScript, TypeScript,
          Python, Java, Go, Rust, C, C++, C#, PHP, SQL and shell scripts.
        </li>
        <li>
          <strong>Encodings.</strong> Switch a file between UTF-8, UTF-8 with
          BOM, UTF-16 LE, UTF-16 BE, ASCII and ISO-8859-1.
        </li>
        <li>
          <strong>Word wrap, minimap and zoom</strong>, each with a keyboard
          shortcut.
        </li>
        <li>
          <strong>Nine color themes</strong>, including a Notepad++-style theme,
          light and dark notepad themes, Dracula, Monokai, Nord, One Dark,
          Solarized and a VS Code theme.
        </li>
        <li>
          <strong>Voice typing.</strong> Dictate text using your browser&apos;s
          built-in speech recognition, where the browser supports it.
        </li>
      </ul>

      <h2>Organizing notes</h2>
      <ul>
        <li>
          <strong>Folders.</strong> A file explorer with nested folders lets you
          group notes however you like.
        </li>
        <li>
          <strong>Workspaces.</strong> After signing in, you can keep separate
          workspaces (for example work, personal and study), each with its own
          folders and files. Without an account you get one workspace.
        </li>
        <li>
          <strong>Daily notes.</strong> One command creates or opens
          today&apos;s note, named by date, inside a &quot;Daily Notes&quot;
          folder.
        </li>
        <li>
          <strong>Favorites and recent files</strong> for jumping back to what
          you use most.
        </li>
        <li>
          <strong>Recycle bin.</strong> Deleted files and folders go to a
          recycle bin first, so you can restore them.
        </li>
      </ul>
      <p>
        The guide{" "}
        <Link href="/guides/organize-notes-with-folders-and-workspaces">
          How to organize notes with folders and workspaces
        </Link>{" "}
        shows one way to set this up.
      </p>

      <h2>Finding things</h2>
      <ul>
        <li>
          <strong>Find and replace</strong> in the current file, and{" "}
          <strong>Find in Files</strong> across the whole workspace.
        </li>
        <li>
          <strong>Quick Open</strong> (<kbd>Ctrl</kbd>+<kbd>P</kbd>) to jump to
          any file by name.
        </li>
        <li>
          <strong>Command Palette</strong> (<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+
          <kbd>P</kbd>) to run any command without hunting through menus.
        </li>
        <li>
          <strong>Go to line</strong> (<kbd>Ctrl</kbd>+<kbd>G</kbd>).
        </li>
      </ul>

      <h2>Saving and storage</h2>
      <p>
        You choose where your notes live. There are two modes, and you can start
        in the first and move to the second at any time.
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Mode</th>
            <th scope="col">Where notes are stored</th>
            <th scope="col">Good for</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Guest mode (no account)</td>
            <td>In this browser on this device</td>
            <td>Quick notes, trying it out, keeping text off the cloud</td>
          </tr>
          <tr>
            <td>Signed in with Google</td>
            <td>In a NextNotePad.com folder in your own Google Drive</td>
            <td>Using notes on several devices, multiple workspaces</td>
          </tr>
        </tbody>
      </table>
      <p>
        When you sign in for the first time, your guest workspace is copied into
        your Drive automatically. You can also export a workspace as a ZIP file
        and import it again later. Signed-in users on Chrome or Edge can keep an
        extra copy of their notes in a folder on their computer. Details are in{" "}
        <Link href="/guides/how-to-save-notes-online">
          How to save notes online
        </Link>
        .
      </p>

      <h2>Comparing and previewing</h2>
      <ul>
        <li>
          <strong>Diff checker.</strong> Compare two tabs side by side or inline
          and see exactly what changed.
        </li>
        <li>
          <strong>Markdown preview</strong>, including a full-page reading view.
        </li>
        <li>
          <strong>Workspace statistics:</strong> file and folder counts, total
          content size and how much browser storage you are using.
        </li>
      </ul>

      <h2>Text and developer tools</h2>
      <p>
        A Tools menu covers the small jobs that usually send you to a separate
        website: formatting JSON, XML, HTML, CSS, JavaScript and TypeScript;
        converting case; sorting and de-duplicating lines; Base64, URL and HTML
        encoding; SHA hashes; UUIDs; Unix timestamp conversion and JWT decoding.
        The full list is on the <Link href="/developers">developer page</Link>.
      </p>
      <p>
        There are also optional AI tools that fix grammar and spelling or turn
        text into Markdown. These send the selected text to an AI provider
        (Google Gemini or Claude) to process it, so avoid using them on anything
        confidential.
      </p>

      <h2>Privacy and protection</h2>
      <ul>
        <li>
          <strong>File encryption.</strong> Lock an individual file or folder
          with a passphrase. The content is encrypted in your browser with
          AES-256-GCM before it is stored.
        </li>
        <li>
          <strong>App password lock.</strong> Signed-in users can require a
          password to open the app, with an optional automatic lock after a
          period of inactivity.
        </li>
        <li>
          <strong>Limited Drive access.</strong> NextNotePad asks only for
          permission to the files it creates, not your whole Drive.
        </li>
      </ul>
      <p>
        Read <Link href="/security">Privacy and security</Link> for exactly how
        this works.
      </p>

      <h2>Install it like an app</h2>
      <p>
        NextNotePad is a progressive web app. In browsers that support it you
        can install it from the address bar or the in-app install button. It
        then opens in its own window and has its own icon.
      </p>
    </ContentPage>
  );
}
