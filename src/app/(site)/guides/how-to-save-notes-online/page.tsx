import Link from "next/link";
import { ContentPage } from "@/components/site/ContentPage";
import { pageMetadata } from "@/lib/seo/site";

const PATH = "/guides/how-to-save-notes-online";

export const metadata = pageMetadata(PATH);

export default function HowToSaveNotesOnlinePage() {
  return (
    <ContentPage
      path={PATH}
      article
      heading="How to save notes online without installing anything"
      intro={
        <p>
          You can write and save notes from any browser in a few seconds. The
          real question is where those notes end up, because that decides
          whether you can find them again tomorrow, on another device, or after
          clearing your browser. Here are the three ways to save notes with
          NextNotePad, and when to use each.
        </p>
      }
      related={[
        "/security",
        "/guides/organize-notes-with-folders-and-workspaces",
        "/faq",
      ]}
    >
      <h2>Option 1: Save in your browser, no account needed</h2>
      <p>This is the fastest way to start, and nothing leaves your device.</p>
      <ol>
        <li>
          Go to <Link href="/">nextnotepad.com</Link>. The editor opens straight
          away.
        </li>
        <li>
          Create a file with <kbd>Ctrl</kbd>+<kbd>N</kbd>, or a folder with{" "}
          <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>N</kbd>, and start typing.
        </li>
        <li>
          Your note is saved automatically a few seconds after you stop typing.
          Press <kbd>Ctrl</kbd>+<kbd>S</kbd> if you want to save immediately.
        </li>
        <li>
          Close the tab whenever you like. Your notes are there when you come
          back in the same browser.
        </li>
      </ol>
      <p>
        <strong>Keep in mind:</strong> these notes live in this browser on this
        device only. They will not appear on your phone, and clearing your
        browsing data for the site deletes them. Private and incognito windows
        usually throw their storage away when you close them.
      </p>

      <h2>Option 2: Save to your own Google Drive</h2>
      <p>
        Use this when you want the same notes on more than one device, or want
        them to survive a browser reset.
      </p>
      <ol>
        <li>
          Click <strong>Sign in with Google</strong> in the app.
        </li>
        <li>
          Approve the permission request. NextNotePad only asks for access to
          the files it creates, not your whole Drive.
        </li>
        <li>
          Your existing guest notes are copied into your Drive automatically the
          first time you sign in, under a{" "}
          <code>NextNotePad.com/Workspaces</code> folder.
        </li>
        <li>
          From then on, every save goes to your Drive. A badge in the toolbar
          shows when a save is in progress, when you are offline, and if a save
          failed.
        </li>
      </ol>
      <p>
        Sign in with the same Google account on another computer or phone and
        your notes are there. Because they are ordinary files in your Drive, you
        can also see them in Google Drive itself.
      </p>

      <h2>Option 3: Keep your own backup as a ZIP file</h2>
      <p>
        Whichever mode you use, you can export a whole workspace as a ZIP
        archive of plain files and folders. Open the Command Palette with{" "}
        <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd> and run{" "}
        <strong>Export Workspace (.zip)</strong>. To restore it later, or move
        it to another browser, run <strong>Import Workspace</strong>.
      </p>
      <p>
        This is the simplest way to keep a copy of guest-mode notes safe before
        you clear your browser or change computers.
      </p>

      <h3>Bonus: a copy in a folder on your computer</h3>
      <p>
        If you are signed in and use Chrome or Edge, you can choose a folder on
        your computer in Settings and NextNotePad will keep a copy of your notes
        there as regular files. It is handy for local backups or for searching
        your notes with desktop tools.
      </p>

      <h2>Which option should you choose?</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">If you want…</th>
            <th scope="col">Use</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>A quick scratchpad with nothing in the cloud</td>
            <td>Option 1, browser storage</td>
          </tr>
          <tr>
            <td>Notes on your laptop and your phone</td>
            <td>Option 2, Google Drive</td>
          </tr>
          <tr>
            <td>A backup you fully control</td>
            <td>Option 3, ZIP export, alongside either of the others</td>
          </tr>
          <tr>
            <td>Private notes that stay unreadable even in storage</td>
            <td>
              Any option, plus a file passphrase (see{" "}
              <Link href="/security">Privacy and security</Link>)
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Common problems</h2>
      <h3>My notes disappeared</h3>
      <p>
        In guest mode, check that you are using the same browser and browser
        profile as before, and not a private window. If the browser&apos;s site
        data was cleared, guest notes cannot be recovered, which is why a ZIP
        backup or Google Drive is worth setting up for anything important. Also
        check the recycle bin: deleted files go there first.
      </p>
      <h3>The toolbar says a save failed</h3>
      <p>
        When signed in, this usually means your connection dropped or your
        Google session expired. Keep the tab open, check your connection, and
        save again. Signing out and back in refreshes the connection to Drive.
      </p>
    </ContentPage>
  );
}
