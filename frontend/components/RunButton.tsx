type RunButtonProps = {
  onClick: () => void;
};

export default function RunButton({ onClick }: RunButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded"
    >
      Run
    </button>
  );
}
