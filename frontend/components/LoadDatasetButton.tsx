type LoadDatasetButtonProps = {
  onClick: () => void;
};

export default function LoadDatasetButton({ onClick }: LoadDatasetButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-4 py-2 text-sm font-medium text-gray-900 bg-gray-200 rounded"
    >
      Load Dataset
    </button>
  );
}
