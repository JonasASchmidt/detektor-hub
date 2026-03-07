import { useState } from "react";
import {
  FieldValues,
  useController,
  UseControllerProps,
} from "react-hook-form";
import TagModal from "./tag-modal";
import TagComponent from "@/components/tags/Tag";
import { TagCategoryWithTags } from "@/app/_types/TagCategoryWithTags.type";
import { Label } from "../../label";
import { Button } from "../../button";
import { TagIcon } from "lucide-react";

interface Props {
  disabled?: boolean;
  tagCategories: TagCategoryWithTags[];
}

export default function TagPicker<TFieldValues extends FieldValues>({
  control,
  name,
  rules,
  tagCategories,
}: UseControllerProps<TFieldValues> & Props) {
  const { field, fieldState: _fieldState } = useController({ name, control, rules });

  const [showModal, setShowModal] = useState(false);

  const handleSubmitModal = (value: string[] | undefined) => {
    setShowModal(false);
    field.onChange(value);
  };

  const selectedTags = tagCategories
    .flatMap((category) => category.tags)
    .filter((tag) => field.value?.includes(tag.id));

  return (
    <div className="form-control w-full">
      <Label>Tags</Label>
      <div className="flex flex-col gap-2">
        <div className="flex gap-1 flex-wrap items-center">
          {selectedTags.map((tag) => {
            return <TagComponent key={`tag_${tag.id}`} tag={tag} />;
          })}
        </div>
        <Button
          type="button"
          onClick={() => setShowModal(true)}
          className="w-auto"
        >
          <TagIcon size={24} />
          Tags auswählen
        </Button>
      </div>
      {showModal && (
        <TagModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmitModal}
          tagCategories={tagCategories}
          value={field.value}
        />
      )}
    </div>
  );
}
