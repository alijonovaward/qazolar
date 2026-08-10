export function LoadMoreButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="min-h-9 self-center rounded-lg border border-neutral-300 px-3 text-xs font-medium text-neutral-600 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-400"
    >
      {loading ? "Yuklanmoqda..." : "Ko'proq yuklash"}
    </button>
  );
}
