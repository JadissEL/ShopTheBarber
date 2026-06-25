
export const SkipLink = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 bg-primary text-primary-foreground rounded-md shadow-lg font-medium transition-transform"
    >
      Skip to content
    </a>
  );
};