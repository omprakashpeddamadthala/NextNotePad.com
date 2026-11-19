import { HomeContent } from "@/components/site/HomeContent";
import { SiteFooter } from "@/components/site/SiteFooter";
import { HomeEditor } from "./HomeEditor";

/**
 * The editor fills the first screen. The root <body> is overflow-hidden, so
 * this div scrolls to reveal the server-rendered description below it.
 */
export default function Home() {
  return (
    <div className="h-full overflow-y-auto overscroll-none">
      <div className="flex h-full flex-col">
        <HomeEditor />
      </div>
      <HomeContent />
      <SiteFooter />
    </div>
  );
}
