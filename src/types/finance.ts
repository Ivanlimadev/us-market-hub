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
