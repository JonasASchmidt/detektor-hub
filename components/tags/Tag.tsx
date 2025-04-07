import { X } from "lucide-react";
import { Badge } from "../ui/badge";
import DynamicIcon from "../ui/input/dynamic-icon";
import { Button } from "../ui/button";

interface Props {
  onClick?: () => void;
  onClose?: (tagId: string) => void;
  tag: {
    name: string;
    id?: string;
    color: string;
    icon: string;
    categoryId?: string;
  };
}

export default function TagComponent({ onClick, onClose, tag }: Props) {
  const { id } = tag;

  return (
    <Badge
      className="flex items-center justify-between gap-2 px-2 h-6 w-fit cursor-pointer"
      onClick={onClick}
      style={{ backgroundColor: tag.color }}
    >
      <DynamicIcon icon={tag.icon} />
      {tag.name}
      {onClose && id && (
        <Button
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onClose(id);
            }
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={() => onClose(id)}
          className="h-full w-1"
          variant="ghost"
        >
          <X className="text-muted-foreground hover:text-foreground" />
        </Button>
      )}
    </Badge>
  );
}
