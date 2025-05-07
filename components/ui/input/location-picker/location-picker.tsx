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
}

export default function LocationPicker<TFieldValues extends FieldValues>({
  control,
  disabled,
  name,
  rules,
}: UseControllerProps<TFieldValues> & Props) {
  const { field, fieldState } = useController({ name, control, rules });

  const [currentInput, setCurrentInput] = useState<string>();
  const [currentValue, setCurrentValue] = useState<string>();
  const [showModal, setShowModal] = useState(false);

  const [lat, setLat] = useState<number>(field.value?.lat ?? 51);
  const [lng, setLng] = useState<number>(field.value?.lng ?? 13);

  const handleBlur: FocusEventHandler<HTMLInputElement> = () => {
    if (!currentInput || !currentValue) {
      return;
    }

    const newLat = currentInput === "lat" ? parseFloat(currentValue) : lat;
    const newLng = currentInput === "lng" ? parseFloat(currentValue) : lng;

    setLat(newLat);
    setLng(newLng);
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
    <>
      <div className="form-control w-full">
        <div className="flex flex-col gap-4 sm:flex-row items-end">
          <div className="flex gap-1 w-full flex-col">
            <Label>Fundort</Label>
            <Button type="button" onClick={() => setShowModal(true)}>
              <MapPinCheckIcon size={24} />
              Position auswählen
            </Button>
          </div>
          <div className="relative w-full">
            <Label htmlFor="lat">Latitude</Label>
            <Input
              id="lat"
              type="number"
              className="input input-bordered w-full text-sm"
              placeholder="Latitude"
              onBlur={handleBlur}
              onChange={handleChange}
              value={currentInput === "lat" ? currentValue : lat}
              min={-90}
              max={90}
              step="any"
              disabled={disabled}
            />
          </div>
          <div className="relative w-full">
            <Label htmlFor="lat">Longitude</Label>
            <Input
              id="lng"
              type="number"
              className="input input-bordered w-full text-sm"
              placeholder="Latitude"
              onBlur={handleBlur}
              onChange={handleChange}
              value={currentInput === "lng" ? currentValue : lng}
              min={-90}
              max={90}
              step="any"
              disabled={disabled}
            />
          </div>
        </div>
      </div>
      {showModal && (
        <LocationModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmitModal}
          value={{ lat: lat || 0, lng: lng || 0 }}
        />
      )}
    </>
  );
}
