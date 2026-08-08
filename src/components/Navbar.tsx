export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-ink/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <svg width="26" height="26" viewBox="0 0 64 64" fill="none">
            <rect width="64" height="64" rx="14" fill="#ef233c" fillOpacity="0.12" />
            <path
              d="M20 40c0-10 6-18 16-18 6 0 10 4 10 9s-3 8-8 8c-4 0-6-2-6-5"
              stroke="#ef233c"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <circle cx="21" cy="41" r="4" fill="#ef233c" />
          </svg>
          <span className="font-display text-lg font-semibold tracking-wide text-white">AKANTACKLE</span>
        </div>
      </div>
    </header>
  )
}
