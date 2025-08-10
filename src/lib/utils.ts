import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 返金額計算：参加費 ×（記録成功日/30）
export function calculateRefund(participationFee: number, successDays: number): number {
  return Math.max(0, participationFee * (successDays / 30))
}

// 募金額計算：参加費×（記録成功日/30）
export function calculateDonation(participationFee: number, successDays: number): number {
  return participationFee * (successDays / 30)
}

// 日付フォーマット関数
export function formatDate(date: Date): string {
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
} 

// ===== JST（日付扱い）ユーティリティ =====
// 'YYYY-MM-DD' の文字列をJST基準で生成
export function getJstYmd(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

// 'YYYY-MM-DD' を起点に日数を加算（JST基準）
export function addDaysToYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map((v) => parseInt(v, 10))
  const utc = new Date(Date.UTC(y, m - 1, d))
  utc.setUTCDate(utc.getUTCDate() + days)
  return getJstYmd(utc)
}

// 文字列日付（YYYY-MM-DD）同士の比較（JST前提、文字列比較で良い）
export function isAfterYmd(a: string, b: string): boolean {
  return a > b
}

// 'YYYY-MM-DD' を日本語表記に（JSTでのローカライズ表示）
export function formatYmdToJa(ymd: string, withWeekday = false): string {
  const [y, m, d] = ymd.split('-').map((v) => parseInt(v, 10))
  const utc = new Date(Date.UTC(y, m - 1, d))
  return utc.toLocaleDateString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...(withWeekday ? { weekday: 'long' as const } : {}),
  })
}