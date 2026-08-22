import { Link } from "@tanstack/react-router";

const nav = [
  { to: "/", label: "Plan" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/impact", label: "Impact" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3.5">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="text-[1.35rem] font-extrabold tracking-tight text-foreground">
            interval
          </span>
          <span className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Delhi NCR
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="pill hover:text-foreground"
              activeProps={{ className: "pill-active" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <span className="ml-auto rounded-full border border-amber-accent/40 bg-amber-accent/12 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-amber-accent-foreground">
          Concept — not affiliated with Eternal or District
        </span>
      </div>
    </header>
  );
}
