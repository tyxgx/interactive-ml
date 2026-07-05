const DATASETS = ["Iris", "Titanic", "Boston Housing", "Wine Quality"];

type DatasetSelectorProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function DatasetSelector({ value, onChange }: DatasetSelectorProps) {
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
        {DATASETS.map((dataset) => (
          <option key={dataset} value={dataset}>
            {dataset}
          </option>
        ))}
      </select>
    </div>
  );
}
