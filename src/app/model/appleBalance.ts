export function applyAppleDelta(balance: number, amount: number) {
  return Math.max(0, balance + amount);
}
