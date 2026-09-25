import { Link } from "@tanstack/react-router";

export function LogoMark({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="var(--color-foreground)" />
      <rect x="13" y="19" width="38" height="10" rx="5" fill="var(--color-dinner)" />
      <rect x="13" y="35" width="38" height="10" rx="5" fill="#fff" />
    </svg>
  );
}

const nav = [
  { to: "/how-it-works", label: "How it works" },
  { to: "/impact", label: "Impact" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-[1000] border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4 sm:px-8">
        <Link to="/" className="flex items-center gap-2" aria-label="Interval home">
          <LogoMark />
          <span className="text-[1.05rem] font-semibold tracking-tight">interval</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "!text-foreground" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
