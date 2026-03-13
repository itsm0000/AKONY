import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-7xl items-center justify-between mx-auto px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <span className="font-inter text-xl font-bold tracking-tight text-primary">AKONY</span>
          <span className="hidden text-sm text-muted-foreground sm:inline-block">
            — صانع الامتحانات الذكي
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
