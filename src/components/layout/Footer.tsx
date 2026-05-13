export function Footer() {
  return (
    <footer className="border-t border-border px-4 md:px-8 py-6 text-xs text-muted-foreground">
      <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          © {new Date().getFullYear()} ELMS — European Labour Market Statistics
        </div>
        <div>Built for the Lovable Hackathon · Data: Eurostat & ILO</div>
      </div>
    </footer>
  );
}
