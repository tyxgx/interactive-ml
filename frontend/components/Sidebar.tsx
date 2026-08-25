import { BrainCircuit } from "lucide-react";
import { Algorithm } from "@/lib/algorithms";

type SidebarProps = {
  algorithms: Algorithm[];
  selectedId: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
};

export default function Sidebar({
  algorithms,
  selectedId,
  onSelect,
  disabled = false,
}: SidebarProps) {
  return (
    <aside className="w-1/5 min-w-[220px] border-r border-border bg-surface-raised h-full overflow-y-auto flex flex-col">
      <div className="flex items-center gap-2 px-4 py-4 border-b border-border">
        <BrainCircuit className="w-5 h-5 text-primary" strokeWidth={2} />
        <span className="font-mono text-sm font-semibold tracking-tight text-foreground">
          Interactive ML
        </span>
      </div>

      <h2 className="px-4 pt-4 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Algorithms
      </h2>
      <ul className="flex flex-col gap-0.5 px-2">
        {algorithms.map((algorithm) => {
          const isSelected = algorithm.id === selectedId;
          return (
            <li key={algorithm.id}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelect(algorithm.id)}
                aria-current={isSelected ? "true" : undefined}
                className={`w-full text-left px-3 py-2 text-sm rounded-md cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  isSelected
                    ? "bg-primary-soft text-primary font-semibold"
                    : "text-foreground/80 hover:bg-surface-sunken hover:text-foreground"
                } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {algorithm.name}
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
