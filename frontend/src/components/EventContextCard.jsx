import { useEffect, useMemo, useRef, useState } from "react"
import { X, Info } from "lucide-react"

/**
 * EventContextCard
 * Affiche une fiche (modal/drawer) avec le rappel théorique/historique d’un événement.
 *
 * Props:
 * - event: {
 *     id?: string,
 *     title?: string,
 *     message?: string,
 *     context?: {
 *       type?: "historique" | "theorie" | string,
 *       tl_dr?: string,
 *       definition?: string,
 *       timeline?: string[],
 *       sources?: {label: string, url: string}[],
 *       why_now?: string
 *     }
 *   }
 * - open: bool (contrôlé)
 * - onClose: fn()
 * - region: string (facultatif, ex. "MENA/Maroc")
 * - onFlagsChange: fn({ context_opened, dwell_time_sec }) (facultatif, analytics)
 * - className: string (facultatif)
 */
export default function EventContextCard({
  event,
  open,
  onClose,
  region = "MENA/Maroc",
  onFlagsChange,
  className = "",
}) {
  const [mounted, setMounted] = useState(false)
  const openAt = useRef(null)

  const ctx = event?.context || {}
  const title = event?.title || "Détails de l’événement"

  useEffect(() => {
    setMounted(true)
  }, [])

  // Body scroll lock (léger)
  useEffect(() => {
    if (!mounted) return
    const original = document.body.style.overflow
    if (open) {
      document.body.style.overflow = "hidden"
      openAt.current = Date.now()
      onFlagsChange?.({ context_opened: true })
    } else {
      document.body.style.overflow = original
      // dwell time
      if (openAt.current) {
        const secs = Math.max(0, Math.round((Date.now() - openAt.current) / 1000))
        onFlagsChange?.({ context_opened: false, dwell_time_sec: secs })
        openAt.current = null
      }
    }
    return () => {
      document.body.style.overflow = original
    }
  }, [open, mounted, onFlagsChange])

  // Esc to close
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === "Escape") onClose?.() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Détails de l'événement"
      className={`fixed inset-0 z-50 ${className}`}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />

      {/* Drawer (mobile) / Modal (desktop) */}
      <div className="
        absolute inset-x-0 bottom-0
        md:inset-auto md:top-1/2 md:left-1/2
        md:-translate-x-1/2 md:-translate-y-1/2
        w-full md:w-[680px]
        bg-white rounded-t-2xl md:rounded-2xl shadow-xl
        p-5 flex flex-col max-h-[85vh]
      ">
        <div className="flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-indigo-600" aria-hidden="true" />
            <h3 className="text-lg font-semibold text-gray-900">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 text-gray-600"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sous-titre court si disponible */}
        {event?.message && (
          <p className="mt-1 text-sm text-gray-600 shrink-0">{event.message}</p>
        )}

        {/* Contenu */}
        <div className="mt-4 space-y-3 text-sm overflow-y-auto overscroll-contain pr-2">
          {ctx.tl_dr && (
            <section className="bg-gray-50 border rounded p-3">
              <div className="text-xs text-gray-600 mb-1">En bref</div>
              <p className="text-gray-800">{ctx.tl_dr}</p>
            </section>
          )}

          {ctx.definition && (
            <section className="bg-gray-50 border rounded p-3">
              <div className="text-xs text-gray-600 mb-1">
                {ctx.type === "historique" ? "Rappel historique" : "Rappel théorique"}
              </div>
              <p className="text-gray-800">{ctx.definition}</p>
            </section>
          )}

          {Array.isArray(ctx.timeline) && ctx.timeline.length > 0 && (
            <section className="bg-gray-50 border rounded p-3">
              <div className="text-xs text-gray-600 mb-1">Chronologie</div>
              <ul className="list-disc ml-5 text-gray-800 space-y-1">
                {ctx.timeline.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </section>
          )}

          {ctx.why_now && (
            <section className="bg-indigo-50 border border-indigo-100 rounded p-3">
              <div className="text-xs text-indigo-600 mb-1">Pourquoi maintenant ?</div>
              <p className="text-indigo-900">{ctx.why_now}</p>
            </section>
          )}

          {Array.isArray(ctx.sources) && ctx.sources.length > 0 && (
            <section className="bg-white border rounded p-3">
              <div className="text-xs text-gray-600 mb-1">Sources</div>
              <ul className="list-disc ml-5 space-y-1">
                {ctx.sources.map((s, i) => (
                  <li key={i}>
                    <a
                      className="underline text-gray-900"
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800"
          >
            J’ai compris
          </button>
        </div>
      </div>
    </div>
  )
}
