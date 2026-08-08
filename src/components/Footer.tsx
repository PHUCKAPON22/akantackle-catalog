import { Link } from 'react-router-dom'
import { Phone } from 'lucide-react'

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border/80 py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 text-sm text-zinc-500 sm:flex-row sm:justify-between sm:px-6">
        <p>© {new Date().getFullYear()} Akantackle — Fishing Tackle Catalog</p>
        <div className="flex items-center gap-4">
          <a
            href="https://www.facebook.com/Akancor"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-brand-400"
          >
            Facebook
          </a>
          <a
            href="https://www.instagram.com/akantackle_official/"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-brand-400"
          >
            Instagram
          </a>
          <a href="tel:0818111448" className="flex items-center gap-1.5 transition-colors hover:text-brand-400">
            <Phone size={15} />
            081-811-1448
          </a>
          <Link to="/admin" className="text-zinc-600 transition-colors hover:text-zinc-300">
            สำหรับผู้ดูแลระบบ
          </Link>
        </div>
      </div>
    </footer>
  )
}
