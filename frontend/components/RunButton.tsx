import { Play } from "lucide-react";
import { button } from "@/lib/ui";

type RunButtonProps = {
  onClick: () => void;
};

export default function RunButton({ onClick }: RunButtonProps) {
  return (
    <button type="button" onClick={onClick} className={button.primary}>
      <Play className="w-4 h-4" strokeWidth={2.5} />
      Run
    </button>
  );
}
