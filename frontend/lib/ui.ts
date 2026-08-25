export const card =
  "bg-surface-raised border border-border rounded-lg";

export const label =
  "text-xs font-semibold text-muted-foreground uppercase tracking-wide";

export const input =
  "border border-border-strong bg-surface-raised rounded-md px-3 py-2 text-sm text-foreground " +
  "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent " +
  "transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed";

const buttonBase =
  "inline-flex items-center justify-center gap-1.5 rounded-md text-sm font-medium " +
  "cursor-pointer transition-colors duration-150 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

export const button = {
  primary: `${buttonBase} bg-primary text-primary-foreground px-4 py-2 hover:bg-primary-hover`,
  secondary: `${buttonBase} bg-surface-sunken text-foreground border border-border-strong px-4 py-2 hover:bg-border/40`,
  subtle: `${buttonBase} bg-transparent text-muted-foreground border border-border px-3 py-1.5 hover:bg-surface-sunken hover:text-foreground`,
  accent: `${buttonBase} bg-accent text-accent-foreground px-3 py-1.5 hover:opacity-90`,
  destructiveGhost: `${buttonBase} bg-transparent text-destructive border border-border px-3 py-1.5 hover:bg-destructive-soft`,
  sm: `${buttonBase} bg-primary text-primary-foreground px-3 py-1.5`,
};
