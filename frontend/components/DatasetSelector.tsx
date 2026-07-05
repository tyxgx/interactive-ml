import { DatasetListItem } from "@/lib/dataset";

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
    <div className="flex flex-col gap-1">
      <label htmlFor="dataset" className="text-sm font-medium text-gray-700">
        Dataset
      </label>
      <select
        id="dataset"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-64 border border-gray-300 rounded px-3 py-2 text-sm"
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
