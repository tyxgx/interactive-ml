import { DatasetListItem } from "@/lib/dataset";
import { label as labelClass, input } from "@/lib/ui";

type DatasetSelectorProps = {
  datasets: DatasetListItem[];
  value: string;
  onChange: (value: string) => void;
};

export default function DatasetSelector({
  datasets,
  value,
  onChange,
}: DatasetSelectorProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="dataset" className={labelClass}>
        Dataset
      </label>
      <select
        id="dataset"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-64 cursor-pointer ${input}`}
      >
        {datasets.map((dataset) => (
          <option key={dataset.name} value={dataset.name}>
            {dataset.name}
          </option>
        ))}
      </select>
    </div>
  );
}
