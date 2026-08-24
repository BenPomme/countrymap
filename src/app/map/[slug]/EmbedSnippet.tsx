'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

export default function EmbedSnippet({ slug }: { slug: string }) {
  const snippet = `<iframe src="https://theworldtruth.com/embed/${slug}/" width="100%" height="480" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section className="mt-10 bg-white rounded-2xl shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Embed this map</h2>
      <p className="text-gray-700 mb-4">
        Paste this iframe on any site. It credits The World Truth Map and links back here.
      </p>
      <pre className="bg-slate-50 border border-gray-200 rounded-xl p-4 text-xs sm:text-sm overflow-x-auto text-gray-800 whitespace-pre-wrap break-all">
        {snippet}
      </pre>
      <button
        type="button"
        onClick={copy}
        className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        {copied ? 'Copied' : 'Copy embed code'}
      </button>
    </section>
  )
}
