'use client'

interface Rule { label: string; test: (p: string) => boolean }

const RULES: Rule[] = [
  { label: 'At least 8 characters',          test: (p) => p.length >= 8 },
  { label: 'One uppercase letter (A–Z)',      test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter (a–z)',      test: (p) => /[a-z]/.test(p) },
  { label: 'One number (0–9)',                test: (p) => /\d/.test(p) },
  { label: 'One special character (!@#$…)',   test: (p) => /[^A-Za-z0-9]/.test(p) },
]

export function passwordScore(password: string): number {
  return RULES.filter((r) => r.test(password)).length
}

export function isStrongPassword(password: string): boolean {
  return passwordScore(password) === RULES.length
}

const LABELS  = ['', 'Very Weak', 'Weak', 'Fair', 'Good', 'Strong']
const COLORS  = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-sky-500', 'bg-emerald-500']
const TEXT_CL = ['', 'text-red-400', 'text-orange-400', 'text-yellow-400', 'text-sky-400', 'text-emerald-400']

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null
  const score = passwordScore(password)

  return (
    <div className="space-y-2 mt-2">
      {/* Bar */}
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < score ? COLORS[score] : 'bg-zinc-700'
            }`}
          />
        ))}
      </div>

      {/* Label */}
      <p className={`text-xs font-medium ${TEXT_CL[score]}`}>{LABELS[score]}</p>

      {/* Rules */}
      <ul className="space-y-1">
        {RULES.map((r) => {
          const ok = r.test(password)
          return (
            <li key={r.label} className={`flex items-center gap-1.5 text-xs ${ok ? 'text-emerald-400' : 'text-zinc-500'}`}>
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${ok ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
              {r.label}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
