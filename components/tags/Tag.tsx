import { X } from "lucide-react";
import { Badge } from "../ui/badge";
import DynamicIcon from "../ui/input/dynamic-icon";
import { Button } from "../ui/button";

interface Props {
  onClick?: () => void;
  onClose?: (tagId: string) => void;
  className?: string;
  tag: {
    name: string;
    id?: string;
    color: string;
    icon: string;
    categoryId?: string;
  };
}

export default function TagComponent({ onClick, onClose, tag, className }: Props) {
  const { id } = tag;

  return (
    <Badge
      className={`flex items-center justify-between gap-2 px-2 h-6 w-fit cursor-pointer ${className}`}
      onClick={onClick}
      style={{ backgroundColor: tag.color }}
    >
      <DynamicIcon icon={tag.icon} />
      <span className="uppercase tracking-wide text-[11px] font-semibold">{tag.name}</span>
      {onClose && id && (
        <Button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose(id);
          }}
          className="h-4 w-4 p-0 ml-1.5 rounded-full border-none group flex items-center justify-center"
          variant="ghost"
        >
          <X className="h-3 w-3 text-white/50 group-hover:text-white transition-colors" />
        </Button>
      )}
    </Badge>
  );
}
