import { label as labelClass, input } from "@/lib/ui";

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
    <div className="flex flex-col gap-1.5">
      <label htmlFor="target-column" className={labelClass}>
        Target Column
      </label>
      <select
        id="target-column"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-64 cursor-pointer ${input}`}
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
