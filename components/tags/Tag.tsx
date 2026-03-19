import { X } from "lucide-react";

interface Props {
  onClick?: (e: React.MouseEvent) => void;
  onClose?: (tagId: string) => void;
  className?: string;
  /** Reduce vertical padding by 2px for inline meta rows */
  compact?: boolean;
  /** Larger h-8 style used on detail pages */
  large?: boolean;
  tag: {
    name: string;
    id?: string;
    color: string;
    icon?: string | null;
    categoryId?: string;
  };
}

export default function TagComponent({ onClick, onClose, tag, className, compact, large }: Props) {
  const { id } = tag;

  const sizeClass = large
    ? `h-8 pl-3 ${onClose ? "pr-2" : "pr-3"} gap-1.5 text-[12px]`
    : `pl-2 ${onClose ? "pr-1" : "pr-2"} ${compact ? "py-px" : "py-0.5"} gap-1 text-[11px]`;

  return (
    <span
      className={`inline-flex items-center ${sizeClass} rounded uppercase font-semibold tracking-wide text-white ${onClick ? "cursor-pointer hover:opacity-80 transition-opacity" : ""} ${className ?? ""}`}
      style={{ backgroundColor: tag.color }}
      onClick={onClick}
    >
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
