// Space-grouped thousands (e.g. "9 563 669") — matches how these numbers are
// conventionally shown, and doesn't depend on uz-UZ locale data being
// present in every runtime.
export function formatCount(n: number): string {
  return n.toLocaleString("en-US").replace(/,/g, " ");
}

// Same "uz-UZ" locale date formatting used on the profile page (created_at,
// birth date) — kept consistent across the app rather than inventing a
// second date format just for zikr.
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("uz-UZ");
}
