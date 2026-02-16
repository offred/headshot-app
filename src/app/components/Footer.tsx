export function Footer() {
  return (
    <footer
      className="mt-24 pt-8 border-t border-border-subtle"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className="font-sans text-xs text-tertiary"
          >
            &copy; {new Date().getFullYear()} Off Red, LLC.
          </span>
        </div>
        <p
          className="font-sans text-xs text-tertiary"
        >
          TellyDraft Production Tools
        </p>
      </div>
    </footer>
  );
}
