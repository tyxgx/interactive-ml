type UploadCsvInputProps = {
  onUpload: (file: File) => void;
};

export default function UploadCsvInput({ onUpload }: UploadCsvInputProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="csv-upload" className="text-sm font-medium text-gray-700">
        Upload CSV
      </label>
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
        className="w-64 text-sm text-gray-700"
      />
    </div>
  );
}
