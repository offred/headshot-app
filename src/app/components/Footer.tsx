export function Footer() {
  return (
    <footer
      className="mt-24 pt-8 border-t border-border-subtle"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <a
            href="https://offred.co"
            target="_blank"
            rel="noopener noreferrer"
            className="font-sans text-xs text-tertiary hover:text-secondary transition-colors"
          >
            &copy; {new Date().getFullYear()} Off Red, LLC.
          </a>
        </div>
        <a
          href="https://tellydraft.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-sans text-xs text-tertiary hover:text-secondary transition-colors"
        >
          TellyDraft Production Tools
        </a>
      </div>
    </footer>
  );
}
