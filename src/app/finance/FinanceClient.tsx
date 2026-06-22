'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Wallet, Plus, Trash2, X, Loader2, TrendingUp, TrendingDown, LogIn,
  CreditCard, PiggyBank, Landmark, Banknote, Target, Repeat, PieChart, Pencil,
} from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import {
  ACCOUNT_TYPES, LIABILITY_TYPES,
  type FinanceAccount, type FinanceTransaction, type AccountType, type TxnType,
  type FinanceCategory, type FinanceBudget, type FinanceRecurring, type FinanceGoal,
  type Frequency, FREQUENCIES,
} from '@/types/finance'

const fmtUSD = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })

const ACCOUNT_ICON: Record<AccountType, React.ElementType> = {
  checking: Landmark, savings: PiggyBank, cash: Banknote, credit_card: CreditCard,
  investment: TrendingUp, loan: Landmark, other: Wallet,
}

const monthKey = () => new Date().toISOString().slice(0, 7) // YYYY-MM

// Visual due-date reminder (push notifications come later, with FCM).
function dueBadge(next_due: string | null): { label: string; cls: string } | null {
  if (!next_due) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const due = new Date(next_due + 'T00:00:00')
  const days = Math.round((due.getTime() - today.getTime()) / 86_400_000)
  if (days < 0)  return { label: `Overdue ${-days}d`, cls: 'bg-red-500/15 text-red-400' }
  if (days === 0) return { label: 'Due today',        cls: 'bg-amber-500/15 text-amber-400' }
  if (days <= 7)  return { label: `Due in ${days}d`,  cls: 'bg-amber-500/15 text-amber-400' }
  return { label: `in ${days}d`, cls: 'bg-zinc-800 text-zinc-400' }
}

export function FinanceClient() {
  const { user, loading } = useAuth()
  const qc = useQueryClient()

  const accountsQ = useQuery<FinanceAccount[]>({
    queryKey: ['finance-accounts'],
    queryFn: () => fetch('/api/finance/accounts').then((r) => (r.ok ? r.json() : [])),
    enabled: !!user,
  })
  const txnsQ = useQuery<FinanceTransaction[]>({
    queryKey: ['finance-transactions'],
    queryFn: () => fetch('/api/finance/transactions').then((r) => (r.ok ? r.json() : [])),
    enabled: !!user,
  })
  const categoriesQ = useQuery<FinanceCategory[]>({
    queryKey: ['finance-categories'],
    queryFn: () => fetch('/api/finance/categories').then((r) => (r.ok ? r.json() : [])),
    enabled: !!user,
  })
  const budgetsQ = useQuery<FinanceBudget[]>({
    queryKey: ['finance-budgets'],
    queryFn: () => fetch('/api/finance/budgets').then((r) => (r.ok ? r.json() : [])),
    enabled: !!user,
  })
  const recurringQ = useQuery<FinanceRecurring[]>({
    queryKey: ['finance-recurring'],
    queryFn: () => fetch('/api/finance/recurring').then((r) => (r.ok ? r.json() : [])),
    enabled: !!user,
  })
  const goalsQ = useQuery<FinanceGoal[]>({
    queryKey: ['finance-goals'],
    queryFn: () => fetch('/api/finance/goals').then((r) => (r.ok ? r.json() : [])),
    enabled: !!user,
  })

  const [showAccount, setShowAccount] = useState(false)
  const [showTxn, setShowTxn] = useState(false)
  const [showBudgets, setShowBudgets] = useState(false)
  const [showRecurring, setShowRecurring] = useState(false)
  const [goalEdit, setGoalEdit] = useState<FinanceGoal | null | undefined>(undefined) // undefined=closed, null=new

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-zinc-500" /></div>
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-screen-md px-4 py-16 text-center">
        <Wallet className="mx-auto h-10 w-10 text-emerald-400" />
        <h1 className="mt-4 text-2xl font-bold text-white">Your money, all in one place</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-400">
          Track accounts, net worth and spending. Sign in to start your personal finance hub.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/auth/login" className="flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800">
            <LogIn className="h-4 w-4" /> Sign In
          </Link>
          <Link href="/auth/register" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
            Create free account
          </Link>
        </div>
      </div>
    )
  }

  const accounts = accountsQ.data ?? []
  const txns = txnsQ.data ?? []

  const assets = accounts.filter((a) => !LIABILITY_TYPES.includes(a.type)).reduce((s, a) => s + a.balance, 0)
  const liabilities = accounts.filter((a) => LIABILITY_TYPES.includes(a.type)).reduce((s, a) => s + a.balance, 0)
  const netWorth = assets - liabilities

  const categories = categoriesQ.data ?? []
  const budgets = budgetsQ.data ?? []
  const catName = new Map(categories.map((c) => [c.id, c.name]))

  const mk = monthKey()
  const thisMonth = txns.filter((t) => t.date.startsWith(mk))
  const income = thisMonth.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = thisMonth.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  // Spent this month per category (expenses only).
  const spentByCat = new Map<string, number>()
  for (const t of thisMonth) {
    if (t.type === 'expense' && t.category_id) {
      spentByCat.set(t.category_id, (spentByCat.get(t.category_id) ?? 0) + t.amount)
    }
  }
  // Show budgeted categories first, then any category with spending this month.
  const budgetRows = budgets
    .map((b) => ({ ...b, name: catName.get(b.category_id) ?? '—', spent: spentByCat.get(b.category_id) ?? 0 }))
    .sort((a, b) => b.spent / (b.amount || 1) - a.spent / (a.amount || 1))

  const recurring = recurringQ.data ?? []
  const perMonthFactor = (f: Frequency) => FREQUENCIES.find((x) => x.value === f)?.perMonth ?? 1
  const monthlySubs = recurring
    .filter((r) => r.active && r.type === 'expense')
    .reduce((s, r) => s + r.amount * perMonthFactor(r.frequency), 0)

  const goals = goalsQ.data ?? []

  const refresh = () => {
    for (const k of ['finance-accounts', 'finance-transactions', 'finance-categories', 'finance-budgets', 'finance-recurring', 'finance-goals']) {
      qc.invalidateQueries({ queryKey: [k] })
    }
  }

  async function deleteRecurring(id: string) {
    await fetch(`/api/finance/recurring/${id}`, { method: 'DELETE' })
    refresh()
  }
  async function deleteGoal(id: string) {
    await fetch(`/api/finance/goals/${id}`, { method: 'DELETE' })
    refresh()
  }

  async function deleteAccount(id: string) {
    await fetch(`/api/finance/accounts/${id}`, { method: 'DELETE' })
    refresh()
  }
  async function deleteTxn(id: string) {
    await fetch(`/api/finance/transactions/${id}`, { method: 'DELETE' })
    refresh()
  }

  return (
    <div className="mx-auto max-w-screen-lg px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Finance</h1>
          <p className="text-sm text-zinc-400">Your accounts, net worth and spending</p>
        </div>
        <button
          onClick={() => setShowTxn(true)}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
        >
          <Plus className="h-4 w-4" /> Add transaction
        </button>
      </div>

      {/* Top cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs font-medium text-zinc-500">Net Worth</p>
          <p className={`mt-1 text-2xl font-bold ${netWorth >= 0 ? 'text-white' : 'text-red-400'}`}>{fmtUSD(netWorth)}</p>
          <p className="mt-1 text-[11px] text-zinc-500">
            Assets {fmtUSD(assets)} · Liabilities {fmtUSD(liabilities)}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-zinc-500">Income · this month</p>
          <p className="mt-1 flex items-center gap-1.5 text-2xl font-bold text-emerald-400">
            <TrendingUp className="h-5 w-5" />{fmtUSD(income)}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-zinc-500">Spending · this month</p>
          <p className="mt-1 flex items-center gap-1.5 text-2xl font-bold text-red-400">
            <TrendingDown className="h-5 w-5" />{fmtUSD(expense)}
          </p>
        </Card>
      </div>

      {/* Accounts */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base font-bold text-white">Accounts</h2>
          <button onClick={() => setShowAccount(true)} className="flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300">
            <Plus className="h-3.5 w-3.5" /> Add account
          </button>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800/60">
          {accountsQ.isLoading ? (
            <div className="p-6 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-zinc-500" /></div>
          ) : accounts.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-zinc-500">No accounts yet. Add your bank, card or cash balance to start your net worth.</p>
          ) : accounts.map((a) => {
            const Icon = ACCOUNT_ICON[a.type] ?? Wallet
            const isLiab = LIABILITY_TYPES.includes(a.type)
            return (
              <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-zinc-800 text-zinc-300"><Icon className="h-[18px] w-[18px]" /></span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{a.name}</p>
                  <p className="text-[11px] capitalize text-zinc-500">{a.type.replace('_', ' ')}{a.institution ? ` · ${a.institution}` : ''}</p>
                </div>
                <p className={`text-sm font-semibold ${isLiab ? 'text-red-400' : 'text-zinc-200'}`}>{isLiab ? '-' : ''}{fmtUSD(a.balance)}</p>
                <button onClick={() => deleteAccount(a.id)} className="text-zinc-600 hover:text-red-400" aria-label="Delete account"><Trash2 className="h-4 w-4" /></button>
              </div>
            )
          })}
        </div>
      </section>

      {/* Budgets */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base font-bold text-white">Budgets · this month</h2>
          <button onClick={() => setShowBudgets(true)} className="flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300">
            <PieChart className="h-3.5 w-3.5" /> Manage
          </button>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800/60">
          {budgetRows.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-zinc-500">No budgets yet. Tap “Manage” to set a monthly limit per category.</p>
          ) : budgetRows.map((b) => {
            const pct = b.amount > 0 ? Math.min(100, (b.spent / b.amount) * 100) : 0
            const over = b.spent > b.amount
            const bar = over ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'
            return (
              <div key={b.id} className="px-4 py-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-white">{b.name}</span>
                  <span className={over ? 'text-red-400' : 'text-zinc-400'}>{fmtUSD(b.spent)} <span className="text-zinc-600">/ {fmtUSD(b.amount)}</span></span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                  <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Subscriptions & recurring bills */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Subscriptions &amp; bills</h2>
            <p className="text-[11px] text-zinc-500">~{fmtUSD(monthlySubs)}/mo</p>
          </div>
          <button onClick={() => setShowRecurring(true)} className="flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300">
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800/60">
          {recurringQ.isLoading ? (
            <div className="p-6 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-zinc-500" /></div>
          ) : recurring.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-zinc-500">No subscriptions yet. Add Netflix, rent, gym… to track recurring bills and due dates.</p>
          ) : recurring.map((r) => {
            const badge = dueBadge(r.next_due)
            return (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-zinc-800 text-zinc-300"><Repeat className="h-[18px] w-[18px]" /></span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-white">{r.name}{!r.active && <span className="ml-1.5 text-[10px] text-zinc-600">(paused)</span>}</p>
                  <div className="flex items-center gap-1.5">
                    <p className="text-[11px] capitalize text-zinc-500">{r.frequency}</p>
                    {badge && <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${badge.cls}`}>{badge.label}</span>}
                  </div>
                </div>
                <p className={`text-sm font-semibold ${r.type === 'income' ? 'text-emerald-400' : 'text-zinc-200'}`}>{r.type === 'income' ? '+' : '-'}{fmtUSD(r.amount)}</p>
                <button onClick={() => deleteRecurring(r.id)} className="text-zinc-600 hover:text-red-400" aria-label="Delete recurring"><Trash2 className="h-4 w-4" /></button>
              </div>
            )
          })}
        </div>
      </section>

      {/* Recent transactions */}
      <section>
        <h2 className="mb-2 text-base font-bold text-white">Recent transactions</h2>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800/60">
          {txnsQ.isLoading ? (
            <div className="p-6 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-zinc-500" /></div>
          ) : txns.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-zinc-500">No transactions yet. Tap “Add transaction” to log your first one.</p>
          ) : txns.slice(0, 15).map((t) => (
            <div key={t.id} className="flex items-center gap-3 px-4 py-3">
              <span className={`flex h-9 w-9 items-center justify-center rounded-[10px] ${t.type === 'income' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-800 text-zinc-300'}`}>
                {t.type === 'income' ? <TrendingUp className="h-[18px] w-[18px]" /> : <TrendingDown className="h-[18px] w-[18px]" />}
              </span>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-white">{t.note || (t.category_id && catName.get(t.category_id)) || (t.type === 'income' ? 'Income' : 'Expense')}</p>
                <p className="text-[11px] text-zinc-500">{t.date}{t.category_id && catName.get(t.category_id) ? ` · ${catName.get(t.category_id)}` : ''}</p>
              </div>
              <p className={`text-sm font-semibold ${t.type === 'income' ? 'text-emerald-400' : 'text-zinc-200'}`}>{t.type === 'income' ? '+' : '-'}{fmtUSD(t.amount)}</p>
              <button onClick={() => deleteTxn(t.id)} className="text-zinc-600 hover:text-red-400" aria-label="Delete transaction"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      </section>

      {/* Goals */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base font-bold text-white">Goals</h2>
          <button onClick={() => setGoalEdit(null)} className="flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300">
            <Plus className="h-3.5 w-3.5" /> Add goal
          </button>
        </div>
        {goals.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-8 text-center text-sm text-zinc-500">
            No goals yet. Set a target — emergency fund, vacation, new phone — and track your progress.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {goals.map((g) => {
              const pct = g.target_amount > 0 ? Math.min(100, (g.current_amount / g.target_amount) * 100) : 0
              const done = g.current_amount >= g.target_amount && g.target_amount > 0
              return (
                <div key={g.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Target className={`h-4 w-4 ${done ? 'text-emerald-400' : 'text-zinc-400'}`} />
                      <p className="text-sm font-semibold text-white">{g.name}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setGoalEdit(g)} className="text-zinc-600 hover:text-zinc-300" aria-label="Edit goal"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => deleteGoal(g.id)} className="text-zinc-600 hover:text-red-400" aria-label="Delete goal"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between text-sm">
                    <span className="font-bold text-white">{fmtUSD(g.current_amount)}</span>
                    <span className="text-xs text-zinc-500">of {fmtUSD(g.target_amount)}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                    <div className={`h-full rounded-full ${done ? 'bg-emerald-400' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-zinc-500">
                    <span>{pct.toFixed(0)}%{done ? ' · reached 🎉' : ''}</span>
                    {g.target_date && <span>by {g.target_date}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Coming next */}
      <section>
        <h2 className="mb-2 text-base font-bold text-white">Coming next</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: PieChart, label: 'Reports' },
            { icon: Banknote, label: 'CSV import' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/40 py-5 text-center">
              <Icon className="h-5 w-5 text-zinc-600" />
              <span className="text-xs font-medium text-zinc-500">{label}</span>
              <span className="text-[10px] text-zinc-600">Soon</span>
            </div>
          ))}
        </div>
      </section>

      {showAccount && <AccountModal onClose={() => setShowAccount(false)} onSaved={() => { setShowAccount(false); refresh() }} />}
      {showTxn && <TransactionModal accounts={accounts} categories={categories} onClose={() => setShowTxn(false)} onSaved={() => { setShowTxn(false); refresh() }} />}
      {showBudgets && <BudgetsModal categories={categories} budgets={budgets} onClose={() => setShowBudgets(false)} onSaved={() => { setShowBudgets(false); refresh() }} />}
      {showRecurring && <RecurringModal categories={categories} onClose={() => setShowRecurring(false)} onSaved={() => { setShowRecurring(false); refresh() }} />}
      {goalEdit !== undefined && <GoalModal goal={goalEdit} onClose={() => setGoalEdit(undefined)} onSaved={() => { setGoalEdit(undefined); refresh() }} />}
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">{children}</div>
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center md:items-center md:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-2xl border-t border-zinc-800 bg-zinc-950 p-5 shadow-2xl md:rounded-2xl md:border">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

const inputCls = 'w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'

function AccountModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('')
  const [type, setType] = useState<AccountType>('checking')
  const [balance, setBalance] = useState('')
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!name.trim()) return
    setSaving(true)
    const res = await fetch('/api/finance/accounts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type, balance: parseFloat(balance) || 0 }),
    })
    setSaving(false)
    if (res.ok) onSaved()
  }

  return (
    <Modal title="Add account" onClose={onClose}>
      <div className="space-y-3">
        <input className={inputCls} placeholder="Account name (e.g. Chase Checking)" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        <select className={inputCls} value={type} onChange={(e) => setType(e.target.value as AccountType)}>
          {ACCOUNT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <input className={inputCls} type="number" inputMode="decimal" placeholder="Current balance" value={balance} onChange={(e) => setBalance(e.target.value)} />
        <button onClick={save} disabled={!name.trim() || saving} className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-40">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Add account
        </button>
      </div>
    </Modal>
  )
}

function TransactionModal({ accounts, categories, onClose, onSaved }: { accounts: FinanceAccount[]; categories: FinanceCategory[]; onClose: () => void; onSaved: () => void }) {
  const [type, setType] = useState<TxnType>('expense')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [accountId, setAccountId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const catOptions = categories.filter((c) => c.kind === (type === 'income' ? 'income' : 'expense'))

  async function save() {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) return
    setSaving(true)
    const res = await fetch('/api/finance/transactions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, amount: amt, date, account_id: accountId || null, category_id: categoryId || null, note: note || null }),
    })
    setSaving(false)
    if (res.ok) onSaved()
  }

  return (
    <Modal title="Add transaction" onClose={onClose}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {(['expense', 'income'] as TxnType[]).map((t) => (
            <button key={t} onClick={() => { setType(t); setCategoryId('') }} className={`rounded-lg py-2 text-sm font-medium capitalize transition-colors ${type === t ? (t === 'income' ? 'bg-emerald-600 text-white' : 'bg-zinc-700 text-white') : 'border border-zinc-700 text-zinc-400'}`}>{t}</button>
          ))}
        </div>
        <input className={inputCls} type="number" inputMode="decimal" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
        <input className={inputCls} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        {catOptions.length > 0 && (
          <select className={inputCls} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">No category</option>
            {catOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
        {accounts.length > 0 && (
          <select className={inputCls} value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            <option value="">No account</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        )}
        <input className={inputCls} placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        <button onClick={save} disabled={!amount || saving} className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-40">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
        </button>
      </div>
    </Modal>
  )
}

function BudgetsModal({ categories, budgets, onClose, onSaved }: { categories: FinanceCategory[]; budgets: FinanceBudget[]; onClose: () => void; onSaved: () => void }) {
  const expenseCats = categories.filter((c) => c.kind === 'expense')
  const original: Record<string, number> = {}
  for (const b of budgets) original[b.category_id] = b.amount

  const [amounts, setAmounts] = useState<Record<string, string>>(
    () => Object.fromEntries(expenseCats.map((c) => [c.id, original[c.id] ? String(original[c.id]) : ''])),
  )
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    const changed = expenseCats.filter((c) => (parseFloat(amounts[c.id]) || 0) !== (original[c.id] ?? 0))
    await Promise.all(changed.map((c) =>
      fetch('/api/finance/budgets', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_id: c.id, amount: parseFloat(amounts[c.id]) || 0 }),
      }),
    ))
    setSaving(false)
    onSaved()
  }

  return (
    <Modal title="Monthly budgets" onClose={onClose}>
      <div className="space-y-2 max-h-[60dvh] overflow-y-auto">
        <p className="pb-1 text-xs text-zinc-500">Set a monthly limit per category. Leave blank for no limit.</p>
        {expenseCats.map((c) => (
          <div key={c.id} className="flex items-center gap-3">
            <span className="flex-1 text-sm text-zinc-200">{c.name}</span>
            <div className="relative w-28">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-500">$</span>
              <input
                className={`${inputCls} pl-5 text-right`} type="number" inputMode="decimal" placeholder="0"
                value={amounts[c.id] ?? ''} onChange={(e) => setAmounts((m) => ({ ...m, [c.id]: e.target.value }))}
              />
            </div>
          </div>
        ))}
      </div>
      <button onClick={save} disabled={saving} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-40">
        {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save budgets
      </button>
    </Modal>
  )
}

function RecurringModal({ categories, onClose, onSaved }: { categories: FinanceCategory[]; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [frequency, setFrequency] = useState<Frequency>('monthly')
  const [nextDue, setNextDue] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [saving, setSaving] = useState(false)

  const catOptions = categories.filter((c) => c.kind === type)

  async function save() {
    if (!name.trim()) return
    setSaving(true)
    const res = await fetch('/api/finance/recurring', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, amount: parseFloat(amount) || 0, type, frequency,
        next_due: nextDue || null, category_id: categoryId || null,
      }),
    })
    setSaving(false)
    if (res.ok) onSaved()
  }

  return (
    <Modal title="Add subscription / bill" onClose={onClose}>
      <div className="space-y-3">
        <input className={inputCls} placeholder="Name (e.g. Netflix, Rent)" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        <div className="grid grid-cols-2 gap-2">
          {(['expense', 'income'] as const).map((t) => (
            <button key={t} onClick={() => { setType(t); setCategoryId('') }} className={`rounded-lg py-2 text-sm font-medium capitalize transition-colors ${type === t ? (t === 'income' ? 'bg-emerald-600 text-white' : 'bg-zinc-700 text-white') : 'border border-zinc-700 text-zinc-400'}`}>{t}</button>
          ))}
        </div>
        <input className={inputCls} type="number" inputMode="decimal" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <select className={inputCls} value={frequency} onChange={(e) => setFrequency(e.target.value as Frequency)}>
            {FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
          <input className={inputCls} type="date" value={nextDue} onChange={(e) => setNextDue(e.target.value)} title="Next due date" />
        </div>
        {catOptions.length > 0 && (
          <select className={inputCls} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">No category</option>
            {catOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
        <button onClick={save} disabled={!name.trim() || saving} className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-40">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Add
        </button>
      </div>
    </Modal>
  )
}

function GoalModal({ goal, onClose, onSaved }: { goal: FinanceGoal | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(goal?.name ?? '')
  const [target, setTarget] = useState(goal ? String(goal.target_amount) : '')
  const [current, setCurrent] = useState(goal ? String(goal.current_amount) : '')
  const [targetDate, setTargetDate] = useState(goal?.target_date ?? '')
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!name.trim()) return
    setSaving(true)
    const body = JSON.stringify({
      name, target_amount: parseFloat(target) || 0,
      current_amount: parseFloat(current) || 0, target_date: targetDate || null,
    })
    const res = goal
      ? await fetch(`/api/finance/goals/${goal.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body })
      : await fetch('/api/finance/goals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })
    setSaving(false)
    if (res.ok) onSaved()
  }

  return (
    <Modal title={goal ? 'Edit goal' : 'Add goal'} onClose={onClose}>
      <div className="space-y-3">
        <input className={inputCls} placeholder="Goal name (e.g. Emergency fund)" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="mb-1 block text-[11px] text-zinc-500">Target</span>
            <input className={inputCls} type="number" inputMode="decimal" placeholder="0" value={target} onChange={(e) => setTarget(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] text-zinc-500">Saved so far</span>
            <input className={inputCls} type="number" inputMode="decimal" placeholder="0" value={current} onChange={(e) => setCurrent(e.target.value)} />
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block text-[11px] text-zinc-500">Target date (optional)</span>
          <input className={inputCls} type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
        </label>
        <button onClick={save} disabled={!name.trim() || saving} className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-40">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} {goal ? 'Save' : 'Add goal'}
        </button>
      </div>
    </Modal>
  )
}
