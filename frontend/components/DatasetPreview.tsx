import { Table2 } from "lucide-react";
import { DatasetResult } from "@/lib/dataset";
import { card } from "@/lib/ui";

type DatasetPreviewProps = {
  result: DatasetResult | null;
};

export default function DatasetPreview({ result }: DatasetPreviewProps) {
  if (!result) {
    return null;
  }

  const missingEntries = Object.entries(result.missing_values);

  return (
    <div className={`${card} p-5 flex flex-col gap-4`}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Table2 className="w-4 h-4 text-primary" strokeWidth={2} />
          Dataset Preview
          <span className="font-mono text-xs font-normal text-muted-foreground">
            {result.shape.rows} rows &times; {result.shape.columns} columns
          </span>
        </h3>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary-soft text-primary">
          {result.schema.problem_type}
        </span>
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-surface-sunken">
              {result.schema.columns.map((column) => (
                <th
                  key={column.name}
                  className="px-3 py-2 text-left font-semibold text-foreground border-b border-border whitespace-nowrap"
                >
                  {column.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row, index) => (
              <tr
                key={index}
                className="odd:bg-surface-raised even:bg-surface-sunken/40"
              >
                {result.schema.columns.map((column) => (
                  <td
                    key={column.name}
                    className="px-3 py-2 font-mono text-xs text-foreground/90 border-b border-border whitespace-nowrap"
                  >
                    {row[column.name]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
            Schema
          </p>
          <ul className="flex flex-col gap-1 text-sm text-foreground/90">
            {result.schema.columns.map((column) => (
              <li key={column.name} className="flex items-baseline gap-1.5">
                <span className="font-medium">{column.name}</span>
                <span className="text-xs font-mono text-muted-foreground">
                  {column.type}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
              Numeric Columns
            </p>
            <p className="text-sm text-foreground/90">
              {result.numeric_columns.join(", ") || "None"}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
              Categorical Columns
            </p>
            <p className="text-sm text-foreground/90">
              {result.categorical_columns.join(", ") || "None"}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
              Missing Values
            </p>
            {missingEntries.length === 0 ? (
              <p className="text-sm text-foreground/90">None</p>
            ) : (
              <ul className="flex flex-col gap-0.5 text-sm text-foreground/90">
                {missingEntries.map(([column, count]) => (
                  <li key={column}>
                    {column} &mdash; {count}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
