import { Fragment } from "react";
import { ContentPage } from "@/components/site/ContentPage";
import { SHORTCUTS, type ShortcutDef } from "@/lib/constants/shortcuts";
import { pageMetadata } from "@/lib/seo/site";

const PATH = "/keyboard-shortcuts";

export const metadata = pageMetadata(PATH);

/** Rendered straight from the editor's own shortcut table so the page cannot drift. */
function groupByCategory(shortcuts: ShortcutDef[]): Map<string, ShortcutDef[]> {
  const groups = new Map<string, ShortcutDef[]>();
  for (const shortcut of shortcuts) {
    const list = groups.get(shortcut.category) ?? [];
    list.push(shortcut);
    groups.set(shortcut.category, list);
  }
  return groups;
}

function Keys({ combo }: { combo: string }) {
  return (
    <>
      {combo.split("+").map((part, i) => (
        <Fragment key={i}>
          {i > 0 && "+"}
          <kbd>{part}</kbd>
        </Fragment>
      ))}
    </>
  );
}

export default function KeyboardShortcutsPage() {
  const groups = groupByCategory(SHORTCUTS);
  return (
    <ContentPage
      path={PATH}
      heading="NextNotePad keyboard shortcuts"
      intro={
        <p>
          Every shortcut available in the editor, grouped by menu. On a Mac, use{" "}
          <kbd>Cmd</kbd> where the table says <kbd>Ctrl</kbd>. You can also open
          the Command Palette with <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd>{" "}
          and search for any command by name.
        </p>
      }
      related={["/features", "/developers"]}
    >
      {[...groups].map(([category, shortcuts]) => (
        <section key={category}>
          <h2>{category}</h2>
          <table>
            <thead>
              <tr>
                <th scope="col">Action</th>
                <th scope="col">Shortcut</th>
              </tr>
            </thead>
            <tbody>
              {shortcuts.map((shortcut) => (
                <tr key={shortcut.action}>
                  <td>{shortcut.label}</td>
                  <td className="whitespace-nowrap">
                    <Keys combo={shortcut.keys} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
      <h2>Voice typing</h2>
      <p>
        Hold <Keys combo="Alt+V" /> to dictate and release it to stop.{" "}
        <Keys combo="Ctrl+Shift+Space" /> also works, although some operating
        systems use that combination to switch input languages before the
        browser sees it.
      </p>
      <h2>Editor shortcuts from Monaco</h2>
      <p>
        Because the editor is built on Monaco, the standard Monaco and VS Code
        editing keys also work, such as <kbd>Alt</kbd>+<kbd>Click</kbd> to add
        another cursor and <kbd>Alt</kbd>+<kbd>Up</kbd> or <kbd>Alt</kbd>+
        <kbd>Down</kbd> to move a line.
      </p>
    </ContentPage>
  );
}
