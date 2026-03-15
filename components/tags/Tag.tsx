import { X } from "lucide-react";
import DynamicIcon from "../ui/input/dynamic-icon";

interface Props {
  onClick?: () => void;
  onClose?: (tagId: string) => void;
  className?: string;
  /** Reduce vertical padding by 2px for inline meta rows */
  compact?: boolean;
  tag: {
    name: string;
    id?: string;
    color: string;
    icon: string;
    categoryId?: string;
  };
}

export default function TagComponent({ onClick, onClose, tag, className, compact }: Props) {
  const { id } = tag;

  return (
    <span
      className={`inline-flex items-center gap-1 pl-2 ${onClose ? "pr-1" : "pr-2"} ${compact ? "py-px" : "py-0.5"} rounded uppercase text-[11px] font-semibold tracking-wide text-white ${onClick ? "cursor-pointer hover:opacity-80 transition-opacity" : ""} ${className ?? ""}`}
      style={{ backgroundColor: tag.color }}
      onClick={onClick}
    >
      <DynamicIcon icon={tag.icon} className="h-3 w-3 shrink-0" />
      <span>{tag.name}</span>
      {onClose && id && (
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(id); }}
          className="flex items-center justify-center ml-0.5"
        >
          <X className="h-3 w-3 text-white/60 hover:text-white transition-colors" />
        </button>
      )}
    </span>
  );
}
