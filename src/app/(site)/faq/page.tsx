import Link from "next/link";
import type { ReactNode } from "react";
import { ContentPage } from "@/components/site/ContentPage";
import { pageMetadata } from "@/lib/seo/site";

const PATH = "/faq";

export const metadata = pageMetadata(PATH);

const FAQ: { question: string; answer: ReactNode }[] = [
  {
    question: "Is NextNotePad free?",
    answer: <p>Yes. The editor and all of its features are free to use.</p>,
  },
  {
    question: "Do I need an account?",
    answer: (
      <p>
        No. Open the site and start typing; your notes are saved in your
        browser. Signing in with Google is optional and adds storage in your own
        Google Drive, access from several devices, multiple workspaces, the app
        password lock and a local folder copy.
      </p>
    ),
  },
  {
    question: "Where are my notes saved?",
    answer: (
      <p>
        Without an account, in your browser&apos;s storage on the device you are
        using. After you sign in, as files in a NextNotePad.com folder in your
        Google Drive. The{" "}
        <Link href="/guides/how-to-save-notes-online">saving guide</Link> covers
        both, plus ZIP backups.
      </p>
    ),
  },
  {
    question: "Can NextNotePad see my notes?",
    answer: (
      <p>
        Guest-mode notes stay in your browser and are not uploaded. Signed-in
        notes are stored in your Google Drive, and the app asks only for access
        to files it creates. If you use the optional AI tools, the selected text
        is sent to an AI provider for processing. For anything sensitive, lock
        the file with a passphrase so it is encrypted before it is stored. Read{" "}
        <Link href="/security">Privacy and security</Link> for the details.
      </p>
    ),
  },
  {
    question: "Does it work offline?",
    answer: (
      <p>
        Partly. The editor needs an internet connection to load. Once it is
        open, guest-mode notes are saved to your browser, so you can keep
        writing if the connection drops. When you are signed in and offline, the
        toolbar shows an offline badge, and changes need a connection to reach
        your Drive.
      </p>
    ),
  },
  {
    question: "Does autosave work?",
    answer: (
      <p>
        Yes. By default your note is saved 5 seconds after you stop typing. In
        Settings you can change this to 2 or 10 seconds, or switch to saving
        manually with <kbd>Ctrl</kbd>+<kbd>S</kbd>.
      </p>
    ),
  },
  {
    question: "Which browsers and devices are supported?",
    answer: (
      <p>
        Current versions of Chrome, Edge, Firefox and Safari on desktop and
        mobile. A few features depend on the browser: voice typing needs
        built-in speech recognition, and the local folder copy needs Chrome or
        Edge on a computer.
      </p>
    ),
  },
  {
    question: "Can I install it as an app?",
    answer: (
      <p>
        Yes. NextNotePad is a progressive web app, so in supporting browsers you
        can install it from the address bar or the install button in the app. It
        then opens in its own window with its own icon.
      </p>
    ),
  },
  {
    question: "Is it a replacement for Notepad++?",
    answer: (
      <p>
        For many everyday jobs, yes, especially on computers where you cannot
        install Notepad++. It does not have plugins or macros and cannot edit
        files on your disk in place. See the{" "}
        <Link href="/notepad-plus-plus-alternative">honest comparison</Link>.
      </p>
    ),
  },
  {
    question: "Can I open and edit files from my computer?",
    answer: (
      <p>
        You can import files with <kbd>Ctrl</kbd>+<kbd>O</kbd> and edit them.
        The imported copy lives in your NextNotePad workspace; the original file
        on your disk is not changed. To get files back out, export the workspace
        as a ZIP.
      </p>
    ),
  },
  {
    question: "How do I back up or move my notes?",
    answer: (
      <p>
        Open the Command Palette with <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+
        <kbd>P</kbd> and run Export Workspace (.zip). Import the ZIP in another
        browser, or keep it as a backup.
      </p>
    ),
  },
  {
    question: "I deleted a note by mistake. Can I get it back?",
    answer: (
      <p>
        Yes, if the recycle bin has not been emptied. Deleted files and folders
        go there first.
      </p>
    ),
  },
];

export default function FaqPage() {
  return (
    <ContentPage
      path={PATH}
      heading="Frequently asked questions"
      intro={
        <p>
          Short answers about how NextNotePad works, where your notes go and
          what it can and cannot do.
        </p>
      }
      related={["/features", "/security", "/guides/how-to-save-notes-online"]}
    >
      {FAQ.map(({ question, answer }) => (
        <section key={question}>
          <h2 className="!text-xl">{question}</h2>
          {answer}
        </section>
      ))}
    </ContentPage>
  );
}
