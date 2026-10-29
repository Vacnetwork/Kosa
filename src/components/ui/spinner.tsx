export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-[15px] text-slate">
      <span
        aria-hidden="true"
        className="h-4 w-4 animate-spin rounded-full border-2 border-paper-dim border-t-navy"
      />
      {label}
    </span>
  );
}

export function PageLoading({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Spinner label={label} />
    </div>
  );
}
