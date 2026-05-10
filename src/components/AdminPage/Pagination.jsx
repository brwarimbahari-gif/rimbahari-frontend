import React from 'react'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'

export default function Pagination({ 
  total, 
  page, 
  pageSize, 
  totalPages, 
  onPageChange 
}) {
  if (totalPages <= 1) return null

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = []
    const showMax = 5
    
    if (totalPages <= showMax) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      
      let start = Math.max(2, page - 1)
      let end = Math.min(totalPages - 1, page + 1)
      
      if (page <= 2) end = 4
      if (page >= totalPages - 1) start = totalPages - 3
      
      if (start > 2) pages.push('...')
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      
      if (end < totalPages - 1) pages.push('...')
      
      pages.push(totalPages)
    }
    return pages
  }

  return (
    <div className="flex items-center justify-between py-6">
      <div className="text-xs text-ash font-medium">
        Menampilkan <span className="text-ink font-bold">{Math.min(total, (page - 1) * pageSize + 1)}</span>
        {total > 0 && (
          <>
            {" "}- <span className="text-ink font-bold">{Math.min(total, page * pageSize)}</span> dari{" "}
          </>
        )}
        <span className="text-ink font-bold">{total}</span> hasil
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-2 rounded-lg border border-sand text-ash hover:text-forest hover:border-forest disabled:opacity-30 disabled:hover:text-ash disabled:hover:border-sand transition-all"
        >
          <ChevronLeft size={16} />
        </button>

        {getPageNumbers().map((p, idx) => (
          <React.Fragment key={idx}>
            {p === '...' ? (
              <div className="w-9 h-9 flex items-center justify-center text-ash">
                <MoreHorizontal size={14} />
              </div>
            ) : (
              <button
                onClick={() => onPageChange(p)}
                className={`w-9 h-9 rounded-lg border text-xs font-bold transition-all ${
                  page === p 
                    ? 'bg-forest border-forest text-bone shadow-warm' 
                    : 'border-sand text-ash hover:text-forest hover:border-forest'
                }`}
              >
                {p}
              </button>
            )}
          </React.Fragment>
        ))}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="p-2 rounded-lg border border-sand text-ash hover:text-forest hover:border-forest disabled:opacity-30 disabled:hover:text-ash disabled:hover:border-sand transition-all"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
