export function SourceNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-muted-foreground mt-4">
      <span className="font-medium text-foreground/70">Source:</span> {children}
    </p>
  );
}
