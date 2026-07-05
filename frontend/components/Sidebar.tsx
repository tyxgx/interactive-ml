import { Algorithm } from "@/lib/algorithms";

type SidebarProps = {
  algorithms: Algorithm[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export default function Sidebar({
  algorithms,
  selectedId,
  onSelect,
}: SidebarProps) {
  return (
    <aside className="w-1/5 border-r border-gray-200 h-full overflow-y-auto">
      <h2 className="px-4 py-3 text-sm font-semibold text-gray-500 uppercase">
        Algorithms
      </h2>
      <ul>
        {algorithms.map((algorithm) => (
          <li key={algorithm.id}>
            <button
              type="button"
              onClick={() => onSelect(algorithm.id)}
              className={`w-full text-left px-4 py-2 text-sm ${
                algorithm.id === selectedId
                  ? "bg-gray-200 text-gray-900 font-medium"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {algorithm.name}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
