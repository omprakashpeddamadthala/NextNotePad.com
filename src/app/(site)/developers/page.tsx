import Link from "next/link";
import { ContentPage } from "@/components/site/ContentPage";
import { pageMetadata } from "@/lib/seo/site";

const PATH = "/developers";

export const metadata = pageMetadata(PATH);

export default function DevelopersPage() {
  return (
    <ContentPage
      path={PATH}
      heading="An online notepad for developers"
      intro={
        <p>
          A place to paste a stack trace, tidy up a JSON response, compare two
          config files or keep a running list of commands. NextNotePad opens in
          a browser tab, highlights code, and keeps the small conversion tools
          you normally search for one at a time in a single menu.
        </p>
      }
      related={[
        "/keyboard-shortcuts",
        "/notepad-plus-plus-alternative",
        "/features",
      ]}
    >
      <h2>Syntax highlighting for 30 languages</h2>
      <p>
        Pick a language from the Language menu or let the file extension choose
        it. Supported languages are plain text, Java, JavaScript, TypeScript,
        Python, Go, Rust, C, C++, C#, PHP, Ruby, Swift, Kotlin, JSON, XML, YAML,
        SQL, HTML, CSS, SCSS, Markdown, Dockerfile, Shell, PowerShell,
        Properties, Terraform, GraphQL, Vue and Razor.
      </p>

      <h2>Format documents in one keystroke</h2>
      <p>
        Press <kbd>Shift</kbd>+<kbd>Alt</kbd>+<kbd>F</kbd> to format the whole
        file or the current selection. The formatter understands JSON, XML,
        HTML, CSS, JavaScript and TypeScript. JSON can also be minified, and
        JSON strings can be escaped or unescaped.
      </p>

      <h2>Built-in text tools</h2>
      <p>
        These run on the selected text, or on the whole file if nothing is
        selected. Find them in the Tools menu or type their name into the
        Command Palette (<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd>).
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">Tools</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Encoding</td>
            <td>
              Base64 encode and decode, URL encode and decode, HTML entity
              encode and decode
            </td>
          </tr>
          <tr>
            <td>Hashing</td>
            <td>SHA-1, SHA-256, SHA-384 and SHA-512</td>
          </tr>
          <tr>
            <td>Case</td>
            <td>
              UPPERCASE, lowercase, Title Case, Sentence case, camelCase,
              PascalCase, snake_case, kebab-case and CONSTANT_CASE
            </td>
          </tr>
          <tr>
            <td>Lines</td>
            <td>
              Sort ascending or descending, remove duplicates, reverse, shuffle,
              join, add or remove line numbers, trim trailing whitespace and
              collapse blank lines
            </td>
          </tr>
          <tr>
            <td>Whitespace</td>
            <td>Convert tabs to spaces and spaces to tabs</td>
          </tr>
          <tr>
            <td>Data</td>
            <td>
              Generate a UUID, convert Unix timestamps to ISO dates and back,
              decode a JWT
            </td>
          </tr>
          <tr>
            <td>Other</td>
            <td>Slugify text for URLs, ROT13</td>
          </tr>
        </tbody>
      </table>
      <p>
        JWT decoding only reads the token&apos;s header and payload. It does not
        verify the signature, so do not treat a decoded token as trusted.
      </p>

      <h2>Compare files with the diff checker</h2>
      <p>
        Open the diff checker from the Tools menu to compare two tabs. You can
        switch between a side-by-side and an inline view, which makes it easy to
        check what changed between two versions of a config file, a SQL query or
        an API response.
      </p>

      <h2>Search across everything</h2>
      <ul>
        <li>
          <kbd>Ctrl</kbd>+<kbd>F</kbd> and <kbd>Ctrl</kbd>+<kbd>H</kbd> to find
          and replace in the current file.
        </li>
        <li>
          <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>F</kbd> to find in every file in
          the workspace.
        </li>
        <li>
          <kbd>Ctrl</kbd>+<kbd>P</kbd> to open a file by name.
        </li>
      </ul>
      <p>
        The full list is on the{" "}
        <Link href="/keyboard-shortcuts">keyboard shortcuts</Link> page.
      </p>

      <h2>Keep secrets out of the cloud</h2>
      <p>
        If you paste tokens, connection strings or customer data, you have two
        options. Guest mode stores notes only in your browser. Or you can lock a
        file with a passphrase, which encrypts it before it is saved anywhere.
        See <Link href="/security">Privacy and security</Link> for details. The
        optional AI tools send text to an outside AI provider, so do not run
        them on sensitive content.
      </p>

      <h2>What it is not</h2>
      <p>
        NextNotePad is an editor, not an IDE. It does not run code, connect to a
        terminal, use language servers for autocomplete across a project, or
        open folders from your computer directly. For quick editing, notes and
        everyday text chores it saves you a download; for building software, use
        a full IDE.
      </p>
    </ContentPage>
  );
}
