// Personal finance manager (manual-only) — shared types.

export type AccountType =
  | 'checking' | 'savings' | 'cash' | 'credit_card' | 'investment' | 'loan' | 'other'

export interface FinanceAccount {
  id: string
  name: string
  type: AccountType
  balance: number
  currency: string
  institution: string | null
  archived: boolean
}

export type TxnType = 'expense' | 'income' | 'transfer'

export interface FinanceTransaction {
  id: string
  account_id: string | null
  category_id: string | null
  type: TxnType
  amount: number
  date: string        // YYYY-MM-DD
  note: string | null
}

export const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: 'checking',    label: 'Checking' },
  { value: 'savings',     label: 'Savings' },
  { value: 'cash',        label: 'Cash' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'investment',  label: 'Investment' },
  { value: 'loan',        label: 'Loan' },
  { value: 'other',       label: 'Other' },
]

// Credit cards and loans represent money owed — they reduce net worth.
export const LIABILITY_TYPES: AccountType[] = ['credit_card', 'loan']

export type CategoryKind = 'expense' | 'income'

export interface FinanceCategory {
  id: string
  name: string
  kind: CategoryKind
  icon: string | null
  color: string | null
}

export interface FinanceBudget {
  id: string
  category_id: string
  amount: number
  period: 'monthly'
}

// Seeded for new users on first load (US-oriented defaults).
export const DEFAULT_CATEGORIES: { name: string; kind: CategoryKind }[] = [
  { name: 'Groceries',       kind: 'expense' },
  { name: 'Dining & Drinks', kind: 'expense' },
  { name: 'Transport',       kind: 'expense' },
  { name: 'Housing & Rent',  kind: 'expense' },
  { name: 'Utilities',       kind: 'expense' },
  { name: 'Shopping',        kind: 'expense' },
  { name: 'Health',          kind: 'expense' },
  { name: 'Entertainment',   kind: 'expense' },
  { name: 'Subscriptions',   kind: 'expense' },
  { name: 'Travel',          kind: 'expense' },
  { name: 'Fees & Charges',  kind: 'expense' },
  { name: 'Other',           kind: 'expense' },
  { name: 'Salary',          kind: 'income' },
  { name: 'Freelance',       kind: 'income' },
  { name: 'Investments',     kind: 'income' },
  { name: 'Other Income',    kind: 'income' },
]
