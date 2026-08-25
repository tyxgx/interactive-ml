import { Upload } from "lucide-react";
import { label as labelClass } from "@/lib/ui";

type UploadCsvInputProps = {
  onUpload: (file: File) => void;
};

export default function UploadCsvInput({ onUpload }: UploadCsvInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="csv-upload" className={labelClass}>
        Upload CSV
      </label>
      <label
        htmlFor="csv-upload"
        className="w-64 flex items-center gap-2 border border-dashed border-border-strong rounded-md px-3 py-2 text-sm text-muted-foreground cursor-pointer transition-colors duration-150 hover:border-primary hover:text-primary hover:bg-primary-soft/40 focus-within:ring-2 focus-within:ring-ring"
      >
        <Upload className="w-4 h-4 shrink-0" strokeWidth={2} />
        <span className="truncate">Choose a CSV file</span>
        <input
          id="csv-upload"
          type="file"
          accept=".csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              onUpload(file);
            }
            e.target.value = "";
          }}
          className="sr-only"
        />
      </label>
    </div>
  );
}
