import { Component, StrictMode, Suspense, lazy, type ReactNode } from 'react'



// Import inside React so startup failures are caught before they blank the page.
const App = lazy(() => import('../App.tsx'))

class StartupBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="flex min-h-dvh items-center justify-center px-6 py-16">
          <section className="w-full max-w-lg rounded-2xl border border-border bg-surface p-8 sm:p-12" aria-labelledby="unavailable-title">
            <p className="mb-8 font-display text-2xl font-bold tracking-widest text-brand-500">AKANTACKLE</p>
            <h1 id="unavailable-title" className="text-3xl font-semibold">Catalog temporarily unavailable</h1>
            <p className="mt-4 leading-relaxed text-zinc-400">We couldn’t open the catalog. Please try again in a moment.</p>
            <button className="mt-8 rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white" onClick={() => window.location.reload()}>Try again</button>
          </section>
        </main>
      )
    }
    return this.props.children
  }
}


export function Startup() {
  return <StrictMode><StartupBoundary><Suspense fallback={<main className="flex min-h-dvh items-center justify-center" role="status">Loading catalog…</main>}><App /></Suspense></StartupBoundary></StrictMode>
}

