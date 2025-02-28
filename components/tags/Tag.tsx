import { Badge } from "../ui/badge";
import DynamicIcon from "../ui/input/dynamic-icon";

interface Props {
  tag: {
    name: string;
    id?: string;
    color: string;
    icon: string;
    categoryId?: string;
  };
}

export default function TagComponent({ tag }: Props) {
  return (
    <Badge
      className="flex items-center gap-1 px-4 w-fit"
      style={{ backgroundColor: tag.color }}
    >
      <DynamicIcon icon={tag.icon} />
      {tag.name}
    </Badge>
  );
}
