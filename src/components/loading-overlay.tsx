export function LoadingOverlay({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-line border-t-carrot" />
    </div>
  );
}
