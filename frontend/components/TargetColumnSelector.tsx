type TargetColumnSelectorProps = {
  columns: string[];
  value: string;
  onChange: (value: string) => void;
};

export default function TargetColumnSelector({
  columns,
  value,
  onChange,
}: TargetColumnSelectorProps) {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor="target-column"
        className="text-sm font-medium text-gray-700"
      >
        Target Column
      </label>
      <select
        id="target-column"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-64 border border-gray-300 rounded px-3 py-2 text-sm"
      >
        {value === "" && (
          <option value="" disabled>
            -- select target column --
          </option>
        )}
        {columns.map((column) => (
          <option key={column} value={column}>
            {column}
          </option>
        ))}
      </select>
    </div>
  );
}
