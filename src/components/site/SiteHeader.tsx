import Image from "next/image";
import Link from "next/link";
import { SiteNavLink } from "./SiteNavLink";

const NAV = [
  { href: "/features", label: "Features" },
  { href: "/developers", label: "Developers" },
  { href: "/notepad-plus-plus-alternative", label: "vs Notepad++" },
  { href: "/guides", label: "Guides" },
  { href: "/faq", label: "FAQ" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
        <Link
          href="/features"
          className="flex shrink-0 items-center gap-2 font-semibold text-slate-900"
        >
          <Image
            src="/icon-192.png"
            alt=""
            width={28}
            height={28}
            className="rounded-md"
          />
          <span>NextNotePad</span>
        </Link>
        <nav
          aria-label="Main"
          className="order-last -mx-2 w-full overflow-x-auto sm:order-none sm:mx-0 sm:w-auto sm:flex-1"
        >
          <ul className="flex items-center gap-1 text-sm whitespace-nowrap">
            {NAV.map((item) => (
              <li key={item.href}>
                <SiteNavLink href={item.href} label={item.label} />
              </li>
            ))}
          </ul>
        </nav>
        <Link
          href="/"
          className="ml-auto shrink-0 rounded-lg bg-primary px-3.5 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90"
        >
          Open notepad
        </Link>
      </div>
    </header>
  );
}
