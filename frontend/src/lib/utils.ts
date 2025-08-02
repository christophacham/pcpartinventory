import { type ClassValue, clsx } from "clsx"

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatCurrency(amount: number, currency = 'kr') {
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('NOK', currency)
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('nb-NO').format(new Date(date))
}

export function formatPercentage(value: number) {
  return `${value.toFixed(1)}%`
}