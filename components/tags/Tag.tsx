import { Badge } from "../ui/badge";
import DynamicIcon from "../ui/input/dynamic-icon";

interface Props {
  onClick?: () => void;
  tag: {
    name: string;
    id?: string;
    color: string;
    icon: string;
    categoryId?: string;
  };
}

export default function TagComponent({ onClick, tag }: Props) {
  return (
    <Badge
      className="flex items-center gap-1 px-4 w-fit cursor-pointer"
      onClick={onClick}
      style={{ backgroundColor: tag.color }}
    >
      <DynamicIcon icon={tag.icon} />
      {tag.name}
    </Badge>
  );
}
