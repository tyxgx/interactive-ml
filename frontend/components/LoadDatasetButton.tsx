import { Database } from "lucide-react";
import { button } from "@/lib/ui";

type LoadDatasetButtonProps = {
  onClick: () => void;
};

export default function LoadDatasetButton({ onClick }: LoadDatasetButtonProps) {
  return (
    <button type="button" onClick={onClick} className={button.secondary}>
      <Database className="w-4 h-4" strokeWidth={2} />
      Load Dataset
    </button>
  );
}
