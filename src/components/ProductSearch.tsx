import { useState } from 'react'

interface SearchResult {
  id: string
  sku: string
  name: string
  description: string | null
  unit_price: number
  quantity_in_stock: number
}

export default function ProductSearch() {
  const [query, setQuery] = useState('')
  const [resultsHtml, setResultsHtml] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSearch() {
    if (!query.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/search?q=${query}`)
      const data: SearchResult[] = await res.json()

      const html = data
        .map(
          (p) =>
            `<div class="result-item">
              <strong>${p.name}</strong>
              <span class="sku">${p.sku}</span>
              <span class="desc">${p.description ?? ''}</span>
            </div>`
        )
        .join('')

      setResultsHtml(html)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search products by name, SKU, or description..."
          className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </div>

      {resultsHtml && (
        <div
          className="bg-white border border-slate-200 rounded-md p-4 text-sm space-y-1"
          dangerouslySetInnerHTML={{ __html: resultsHtml }}
        />
      )}
    </div>
  )
}
