import { DatasetResult } from "@/lib/dataset";

type DatasetPreviewProps = {
  result: DatasetResult | null;
};

export default function DatasetPreview({ result }: DatasetPreviewProps) {
  if (!result) {
    return null;
  }

  const missingEntries = Object.entries(result.missing_values);

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-gray-700">
        Dataset Preview ({result.shape.rows} rows x {result.shape.columns}{" "}
        columns) — problem type: {result.schema.problem_type}
      </h3>

      <table className="border border-gray-300 border-collapse">
        <thead>
          <tr>
            {result.schema.columns.map((column) => (
              <th
                key={column.name}
                className="border border-gray-300 px-2 py-1 text-left"
              >
                {column.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.rows.map((row, index) => (
            <tr key={index}>
              {result.schema.columns.map((column) => (
                <td
                  key={column.name}
                  className="border border-gray-300 px-2 py-1"
                >
                  {row[column.name]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div>
        <p className="font-medium mb-1">Schema</p>
        <ul className="list-disc list-inside text-sm text-gray-700">
          {result.schema.columns.map((column) => (
            <li key={column.name}>
              {column.name} — {column.type}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="font-medium mb-1">Numeric Columns</p>
        <p className="text-sm text-gray-700">
          {result.numeric_columns.join(", ") || "None"}
        </p>
      </div>

      <div>
        <p className="font-medium mb-1">Categorical Columns</p>
        <p className="text-sm text-gray-700">
          {result.categorical_columns.join(", ") || "None"}
        </p>
      </div>

      <div>
        <p className="font-medium mb-1">Missing Values</p>
        {missingEntries.length === 0 ? (
          <p className="text-sm text-gray-700">None</p>
        ) : (
          <ul className="list-disc list-inside text-sm text-gray-700">
            {missingEntries.map(([column, count]) => (
              <li key={column}>
                {column} — {count}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
