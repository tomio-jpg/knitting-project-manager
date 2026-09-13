export const MINIMUM_ROW = 1

export function currentRow(value: number): number {
  return Math.max(MINIMUM_ROW, value)
}

export function nextRow(value: number, amount: number): number {
  return Math.max(MINIMUM_ROW, currentRow(value) + amount)
}
