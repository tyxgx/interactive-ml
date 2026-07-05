export type SchemaColumn = {
  name: string;
  type: "numeric" | "categorical";
};

export type DatasetSchema = {
  columns: SchemaColumn[];
  problem_type: "classification" | "regression";
};

export type DatasetResult = {
  rows: Record<string, string | number>[];
  shape: { rows: number; columns: number };
  schema: DatasetSchema;
  missing_values: Record<string, number>;
  numeric_columns: string[];
  categorical_columns: string[];
};

export type DatasetListItem = {
  name: string;
  default_target: string;
  columns: string[];
};
