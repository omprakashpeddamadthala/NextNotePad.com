import Link from "next/link";
import { ContentPage } from "@/components/site/ContentPage";
import { pageMetadata } from "@/lib/seo/site";

const PATH = "/notepad-plus-plus-alternative";

export const metadata = pageMetadata(PATH);

export default function NotepadPlusPlusAlternativePage() {
  return (
    <ContentPage
      path={PATH}
      heading="A Notepad++ alternative that runs in your browser"
      intro={
        <>
          <p>
            Notepad++ is one of the best-loved free text editors ever made. It
            is also a Windows desktop program, which does not help on a
            Chromebook, a Mac, a locked-down work laptop or someone else&apos;s
            computer.
          </p>
          <p className="mt-4">
            NextNotePad takes a lot of what people like about Notepad++ (tabs,
            syntax highlighting, find in files and a familiar color theme) and
            puts it in a browser tab. It is not a full replacement, and this
            page is clear about where Notepad++ is still the better tool.
          </p>
        </>
      }
      related={["/features", "/developers", "/keyboard-shortcuts"]}
    >
      <p className="text-sm text-slate-500">
        NextNotePad is an independent project and is not affiliated with or
        endorsed by Notepad++ or its developers.
      </p>

      <h2>At a glance</h2>
      <table>
        <thead>
          <tr>
            <th scope="col"></th>
            <th scope="col">NextNotePad</th>
            <th scope="col">Notepad++</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Where it runs</th>
            <td>
              Any modern browser on Windows, macOS, Linux, ChromeOS, Android or
              iOS
            </td>
            <td>
              Windows desktop (other systems only through compatibility layers
              such as Wine)
            </td>
          </tr>
          <tr>
            <th scope="row">Installation</th>
            <td>
              None; open the website, or install it as a web app if you want an
              icon
            </td>
            <td>Download and install, or use the portable version</td>
          </tr>
          <tr>
            <th scope="row">Price</th>
            <td>Free</td>
            <td>Free and open source (GPL)</td>
          </tr>
          <tr>
            <th scope="row">Editing engine</th>
            <td>Monaco (from VS Code)</td>
            <td>Scintilla</td>
          </tr>
          <tr>
            <th scope="row">Tabs, find and replace, find in files</th>
            <td>Yes</td>
            <td>Yes</td>
          </tr>
          <tr>
            <th scope="row">Syntax highlighting</th>
            <td>30 languages</td>
            <td>A much larger built-in list, plus user-defined languages</td>
          </tr>
          <tr>
            <th scope="row">Notes on several devices</th>
            <td>Yes, after signing in, through your own Google Drive</td>
            <td>Not built in; you sync the files yourself</td>
          </tr>
          <tr>
            <th scope="row">Plugins</th>
            <td>No</td>
            <td>Yes, with a large plugin ecosystem</td>
          </tr>
          <tr>
            <th scope="row">Macro recording</th>
            <td>No</td>
            <td>Yes</td>
          </tr>
          <tr>
            <th scope="row">Works with no internet connection</th>
            <td>Limited; the editor needs to load online first</td>
            <td>Yes, fully</td>
          </tr>
          <tr>
            <th scope="row">Edits files on your disk directly</th>
            <td>
              No; you import files, or keep a synced copy in a local folder
              (signed in, Chrome or Edge)
            </td>
            <td>Yes</td>
          </tr>
        </tbody>
      </table>

      <h2>What will feel familiar</h2>
      <ul>
        <li>
          <strong>A Notepad++ color theme.</strong> Choose it under Settings if
          you want the look you are used to.
        </li>
        <li>
          <strong>A classic menu bar</strong> with File, Edit, Search, View,
          Encoding, Language, Tools and Window menus.
        </li>
        <li>
          <strong>Tabs and a file tree</strong> for working with many files at
          once.
        </li>
        <li>
          <strong>Encoding control</strong> for UTF-8, UTF-8 with BOM, UTF-16 LE
          and BE, ASCII and ISO-8859-1.
        </li>
        <li>
          <strong>Familiar shortcuts,</strong> such as <kbd>Ctrl</kbd>+
          <kbd>H</kbd> for replace, <kbd>Ctrl</kbd>+<kbd>G</kbd> for go to line
          and <kbd>Ctrl</kbd>+<kbd>D</kbd> to duplicate a line. See the full{" "}
          <Link href="/keyboard-shortcuts">shortcut list</Link>.
        </li>
        <li>
          <strong>Built-in text tools</strong> for jobs that often need a
          Notepad++ plugin: JSON formatting, Base64, hashes, case conversion,
          sorting lines and comparing two files. They are listed on the{" "}
          <Link href="/developers">developer page</Link>.
        </li>
      </ul>

      <h2>What is different</h2>
      <h3>Your notes can follow you</h3>
      <p>
        Sign in with Google and your workspaces are saved as ordinary files in
        your own Google Drive, so the same notes open on your laptop, your work
        computer and your phone. Without signing in, NextNotePad keeps notes in
        your browser, much like a scratch file you never saved.
      </p>
      <h3>Nothing to install or update</h3>
      <p>
        That matters on computers where you cannot install software, on
        Chromebooks, and when you just need an editor for five minutes on
        someone else&apos;s machine.
      </p>
      <h3>A different editing engine</h3>
      <p>
        Monaco behaves like VS Code rather than like Notepad++. Multiple
        cursors, bracket matching and the Command Palette work the VS Code way.
        If your habits are built around Notepad++-specific features such as its
        column editor dialog or macros, expect to adjust.
      </p>

      <h2>When to stay with Notepad++</h2>
      <ul>
        <li>
          You depend on plugins, macros or user-defined language definitions.
        </li>
        <li>
          You need to edit files in place on your disk or on a network share.
        </li>
        <li>
          You regularly open very large files or work without an internet
          connection.
        </li>
        <li>
          You prefer a native Windows program that keeps everything on your
          machine.
        </li>
      </ul>
      <p>
        Many people use both: Notepad++ at their main Windows desk, and
        NextNotePad everywhere else.
      </p>

      <h2>When NextNotePad is the better fit</h2>
      <ul>
        <li>
          You use macOS, Linux, ChromeOS or a tablet and miss having a
          Notepad++-style editor.
        </li>
        <li>You cannot install software on the computer in front of you.</li>
        <li>
          You want the same notes on several devices without setting up file
          syncing yourself.
        </li>
        <li>
          You want a quick scratchpad that opens in a tab you already have.
        </li>
      </ul>
    </ContentPage>
  );
}
