import { Globe, Users, MapPin, Building2 } from 'lucide-react'
import type { StockDetailData } from '@/lib/hooks/useStockDetail'

export function CompanyInfo({ data }: { data: StockDetailData }) {
  const info = data.info
  if (!info) return null

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-4">
      <h3 className="text-sm font-semibold text-zinc-300">About {data.name}</h3>

      {info.description && (
        <p className="text-sm text-zinc-400 leading-relaxed line-clamp-5">{info.description}</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        {info.sector && (
          <div className="flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
            <div>
              <p className="text-[10px] text-zinc-600">Sector</p>
              <p className="text-xs font-medium text-zinc-300">{info.sector}</p>
            </div>
          </div>
        )}
        {info.industry && (
          <div className="flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
            <div>
              <p className="text-[10px] text-zinc-600">Industry</p>
              <p className="text-xs font-medium text-zinc-300">{info.industry}</p>
            </div>
          </div>
        )}
        {(info.city || info.country) && (
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
            <div>
              <p className="text-[10px] text-zinc-600">Location</p>
              <p className="text-xs font-medium text-zinc-300">
                {[info.city, info.country].filter(Boolean).join(', ')}
              </p>
            </div>
          </div>
        )}
        {info.employees && (
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
            <div>
              <p className="text-[10px] text-zinc-600">Employees</p>
              <p className="text-xs font-medium text-zinc-300">
                {info.employees.toLocaleString()}
              </p>
            </div>
          </div>
        )}
        {info.website && (
          <div className="flex items-center gap-2 col-span-2">
            <Globe className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
            <a
              href={info.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-emerald-400 hover:underline truncate"
            >
              {info.website.replace(/^https?:\/\//, '')}
            </a>
          </div>
        )}
      </div>

      {data.exchange && (
        <div className="rounded-lg bg-zinc-800 px-3 py-2 text-xs text-zinc-400">
          Listed on <span className="font-semibold text-zinc-200">{data.exchange}</span>
        </div>
      )}
    </div>
  )
}
