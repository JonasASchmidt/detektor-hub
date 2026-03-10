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
      className={`flex items-center justify-between gap-2 px-3 h-6 w-fit cursor-pointer ${className}`}
      onClick={onClick}
      style={{ backgroundColor: tag.color }}
    >
      <DynamicIcon icon={tag.icon} />
      <span>{tag.name}</span>
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
          className="h-4 w-4 p-0 ml-1.5 rounded-full bg-white/20 hover:bg-white/40 border-none transition-colors group flex items-center justify-center"
          variant="ghost"
        >
          <X className="h-3 w-3 text-white" />
        </Button>
      )}
    </Badge>
  );
}
