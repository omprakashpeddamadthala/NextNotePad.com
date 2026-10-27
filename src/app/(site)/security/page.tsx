import Link from "next/link";
import { ContentPage } from "@/components/site/ContentPage";
import { pageMetadata } from "@/lib/seo/site";

const PATH = "/security";

export const metadata = pageMetadata(PATH);

export default function SecurityPage() {
  return (
    <ContentPage
      path={PATH}
      heading="Privacy and security: where your notes are stored"
      intro={
        <p>
          A notepad holds things you would not post publicly. This page
          explains, in plain terms, where NextNotePad keeps your text, who can
          reach it, and which tools you can use to protect it further.
        </p>
      }
      related={["/guides/how-to-save-notes-online", "/features", "/faq"]}
    >
      <h2>Guest mode: notes stay in your browser</h2>
      <p>
        If you use NextNotePad without signing in, your files, folders and
        settings are saved in your browser&apos;s own storage (IndexedDB and
        local storage) on the device you are using. They are not uploaded to a
        NextNotePad server.
      </p>
      <p>Two consequences are worth knowing:</p>
      <ul>
        <li>
          Your notes are only on that browser on that device. Another browser, a
          private window or another computer will not see them.
        </li>
        <li>
          Clearing your browser&apos;s site data for nextnotepad.com deletes
          them. Export a ZIP backup from time to time if the notes matter to
          you.
        </li>
      </ul>

      <h2>Signed in: notes live in your own Google Drive</h2>
      <p>
        When you sign in with Google, each workspace becomes a real folder under{" "}
        <code>NextNotePad.com/Workspaces</code> in your Google Drive, and each
        note is a real file in it. Your settings, recent files and favorites are
        kept in a small configuration file in the same NextNotePad.com folder.
        Your Drive is the place your notes are stored; NextNotePad does not keep
        a separate copy of their contents in its own database.
      </p>
      <p>
        NextNotePad&apos;s database holds only what is needed to run your
        account: your Google account ID and email address, the sign-in tokens
        used to reach your Drive on your behalf, account flags, and (if you turn
        it on) a hashed app-lock password.
      </p>

      <h3>What the drive.file permission means</h3>
      <p>
        Google offers apps different levels of access to your Drive. NextNotePad
        requests the narrow <code>drive.file</code> permission, which only
        covers files the app itself created. It cannot browse, read or change
        the rest of your Drive.
      </p>
      <p>
        You can remove NextNotePad&apos;s access at any time from your Google
        Account&apos;s security settings, under third-party connections. Your
        files stay in your Drive when you do.
      </p>

      <h2>Encrypt individual files with a passphrase</h2>
      <p>
        Any file or folder can be locked with a passphrase. When you lock it,
        the content is encrypted inside your browser using AES-256-GCM, with a
        key derived from your passphrase (PBKDF2 with 210,000 iterations). Only
        the encrypted text is saved, whether that is in browser storage or in
        Google Drive. To read the file again, you enter the passphrase and it is
        decrypted locally.
      </p>
      <p>
        <strong>Keep the passphrase safe.</strong> The encryption is designed so
        that the stored data is unreadable without it.
      </p>

      <h2>Lock the whole app with a password</h2>
      <p>
        Signed-in users can set an app password from Settings. You can choose
        when it is asked for: each time you start a new browser session, on your
        first visit of each day, or on every visit and page refresh. You can
        also lock automatically after a period of inactivity and lock the
        installed app when it is reopened. The password is stored as a salted
        scrypt hash, never as plain text.
      </p>
      <p>
        When the installed app goes to the background, NextNotePad covers the
        screen so the operating system&apos;s app switcher does not show a
        preview of your notes.
      </p>

      <h2>Tools that send text elsewhere</h2>
      <p>
        Most features run entirely in your browser. The exceptions are the
        optional AI tools (Fix Grammar &amp; Spelling, Markdown generation and
        the prompt assistant). When you use one, the text you selected is sent
        to an AI provider, either Google Gemini or Claude, to be processed. Do
        not use these tools on passwords, personal data or anything
        confidential.
      </p>
      <p>
        Voice typing uses your browser&apos;s built-in speech recognition. In
        some browsers, such as Chrome, the browser itself sends audio to its
        vendor&apos;s speech service.
      </p>

      <h2>Quick recommendations</h2>
      <ul>
        <li>
          For text you never want in the cloud, use guest mode, and export a ZIP
          backup.
        </li>
        <li>
          For notes you need on several devices, sign in and keep them in your
          Drive.
        </li>
        <li>
          For anything sensitive, in either mode, lock the file with a
          passphrase.
        </li>
        <li>
          On a shared computer, set an app password, or use guest mode in a
          private window and close it when done.
        </li>
      </ul>
      <p>
        Questions about saving? See{" "}
        <Link href="/guides/how-to-save-notes-online">
          How to save notes online
        </Link>
        .
      </p>
    </ContentPage>
  );
}
