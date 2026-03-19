import { LatLngLiteral } from "leaflet";
import { ChangeEventHandler, FocusEventHandler, useState } from "react";
import LocationModal from "./location-modal";
import { MapPinCheckIcon } from "lucide-react";
import { Input } from "../../input";
import { Label } from "../../label";
import { Button } from "../../button";
import {
  FieldValues,
  useController,
  UseControllerProps,
} from "react-hook-form";

interface Props {
  disabled?: boolean;
  hideLabel?: boolean;
}

export default function LocationPicker<TFieldValues extends FieldValues>({
  control,
  disabled,
  name,
  rules,
  hideLabel,
}: UseControllerProps<TFieldValues> & Props) {
  const { field, fieldState: _fieldState } = useController({ name, control, rules });

  const [currentInput, setCurrentInput] = useState<string>();
  const [currentValue, setCurrentValue] = useState<string>();
  const [showModal, setShowModal] = useState(false);

  const [lat, setLat] = useState<number | undefined>(field.value?.lat);
  const [lng, setLng] = useState<number | undefined>(field.value?.lng);

  const handleBlur: FocusEventHandler<HTMLInputElement> = () => {
    if (!currentInput || !currentValue) {
      return;
    }

    const newLat = currentInput === "lat" ? parseFloat(currentValue) : lat;
    const newLng = currentInput === "lng" ? parseFloat(currentValue) : lng;

    setLat(newLat || undefined);
    setLng(newLng || undefined);
    setCurrentInput(undefined);
    setCurrentValue(undefined);

    field.onChange({ lat: newLat, lng: newLng });
  };

  const handleChange: ChangeEventHandler<HTMLInputElement> = ({
    target: { id, value },
  }) => {
    setCurrentValue(value);
    setCurrentInput(id);
  };

  const handleSubmitModal = (value: LatLngLiteral | undefined) => {
    setLat(value?.lat || 0);
    setLng(value?.lng || 0);
    field.onChange({ lat: value?.lat || 0, lng: value?.lng || 0 });
    setShowModal(false);
  };

  return (
    <div className="flex flex-col gap-1.5 flex-1 min-w-[280px]">
      {!hideLabel && <Label htmlFor="lat">Fundort</Label>}
      <div className="flex flex-row flex-wrap gap-1.5 items-center w-full">
        <Input
          id="lat"
          type="number"
          className="flex-1 min-w-[80px] text-sm shrink-0"
          placeholder="Latitude"
          onBlur={handleBlur}
          onChange={handleChange}
          value={currentInput === "lat" ? currentValue : (lat ?? "")}
          min={-90}
          max={90}
          step="any"
          disabled={disabled}
        />
        <Input
          id="lng"
          type="number"
          className="flex-1 min-w-[80px] text-sm shrink-0"
          placeholder="Longitude"
          onBlur={handleBlur}
          onChange={handleChange}
          value={currentInput === "lng" ? currentValue : (lng ?? "")}
          min={-180}
          max={180}
          step="any"
          disabled={disabled}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowModal(true)}
          className="px-3 flex-1 min-w-[120px] whitespace-nowrap gap-2 shrink-0"
        >
          <MapPinCheckIcon size={16} />
          Dein Standort
        </Button>
      </div>
      {showModal && (
        <LocationModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmitModal}
          value={{ lat: lat || 0, lng: lng || 0 }}
        />
      )}
    </div>
  );
}
