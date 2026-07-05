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
  schema: DatasetSchema;
};
