import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-12 md:h-14 max-w-7xl items-center justify-between mx-auto px-3 md:px-8">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="accent-gradient flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold text-white shadow">
            أ
          </div>
          <span className="font-inter text-lg font-bold tracking-tight text-foreground">AKONY</span>
          <span className="hidden text-xs text-muted-foreground md:inline-block">
            — صانع الامتحانات الذكي
          </span>
        </Link>
        <div className="flex items-center gap-2 md:gap-3">
          <ThemeToggle />
          {/* Auth buttons — wired up once Supabase Auth is integrated */}
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            تسجيل الدخول
          </Link>
          <Link
            href="/signup"
            className="hidden sm:inline-flex items-center rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-600"
          >
            إنشاء حساب
          </Link>
        </div>
      </div>
    </header>
  );
}
