import Link from "next/link";
import { ContentPage } from "@/components/site/ContentPage";
import { SITE_PAGES, pageMetadata } from "@/lib/seo/site";

const PATH = "/guides";

export const metadata = pageMetadata(PATH);

export default function GuidesPage() {
  const guides = SITE_PAGES.filter((page) => page.path.startsWith(`${PATH}/`));
  return (
    <ContentPage
      path={PATH}
      heading="NextNotePad guides"
      intro={
        <p>
          Practical, step-by-step guides for writing, saving, organizing and
          protecting notes in your browser.
        </p>
      }
      related={["/features", "/faq"]}
    >
      <ul className="!list-none !pl-0">
        {guides.map((guide) => (
          <li
            key={guide.path}
            className="rounded-lg border border-slate-200 p-5"
          >
            <h2 className="!mt-0 !text-xl">
              <Link href={guide.path}>{guide.title}</Link>
            </h2>
            <p className="!mt-2 text-slate-600">{guide.description}</p>
          </li>
        ))}
      </ul>

      <h2>Where to start</h2>
      <ul>
        <li>
          <strong>New to NextNotePad?</strong> Read{" "}
          <Link href="/guides/how-to-save-notes-online">
            how to save notes online
          </Link>{" "}
          first. It explains the difference between notes kept in your browser
          and notes kept in your Google Drive, which affects everything else.
        </li>
        <li>
          <strong>Notes getting out of hand?</strong> The{" "}
          <Link href="/guides/organize-notes-with-folders-and-workspaces">
            organizing guide
          </Link>{" "}
          sets up a simple folder system and a five-minute weekly review.
        </li>
        <li>
          <strong>Storing anything private?</strong> Read{" "}
          <Link href="/security">privacy and security</Link> to see where your
          text goes and how to encrypt individual files with a passphrase.
        </li>
        <li>
          <strong>Want to work faster?</strong> Learn a handful of{" "}
          <Link href="/keyboard-shortcuts">keyboard shortcuts</Link>: Quick
          Open, Find in Files and the Command Palette cover most of what you
          need.
        </li>
      </ul>
    </ContentPage>
  );
}
