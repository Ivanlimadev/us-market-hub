'use client'
import { useState } from 'react'

interface Props {
  src: string
  symbol: string
  size?: number
  className?: string
}

export function CoinImage({ src, symbol, size = 24, className = '' }: Props) {
  const [error, setError] = useState(false)

  if (error || !src) {
    const fontSize = size <= 28 ? 'text-[9px]' : size <= 40 ? 'text-xs' : 'text-sm'
    return (
      <div
        className={`rounded-full bg-zinc-700 flex items-center justify-center font-bold text-zinc-400 shrink-0 ${fontSize} ${className}`}
        style={{ width: size, height: size }}
      >
        {symbol.slice(0, 2).toUpperCase()}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={symbol}
      width={size}
      height={size}
      className={`rounded-full object-cover shrink-0 ${className}`}
      onError={() => setError(true)}
    />
  )
}
