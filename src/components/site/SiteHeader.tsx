import Image from "next/image";
import Link from "next/link";

const NAV = [
  { href: "/features", label: "Features" },
  { href: "/developers", label: "Developers" },
  { href: "/notepad-plus-plus-alternative", label: "vs Notepad++" },
  { href: "/guides", label: "Guides" },
  { href: "/faq", label: "FAQ" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
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
                <Link
                  href={item.href}
                  className="rounded px-2 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <Link
          href="/"
          className="ml-auto shrink-0 rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Open notepad
        </Link>
      </div>
    </header>
  );
}
