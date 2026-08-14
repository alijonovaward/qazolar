// Space-grouped thousands (e.g. "9 563 669") — matches how these numbers are
// conventionally shown, and doesn't depend on uz-UZ locale data being
// present in every runtime.
export function formatCount(n: number): string {
  return n.toLocaleString("en-US").replace(/,/g, " ");
}
