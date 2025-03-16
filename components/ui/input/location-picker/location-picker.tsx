import { LatLngLiteral } from "leaflet";
import {
  ChangeEventHandler,
  FocusEventHandler,
  useEffect,
  useState,
} from "react";
import LocationModal from "./location-modal";
import { MapPinCheckIcon } from "lucide-react";
import { Input } from "../../input";
import { Label } from "../../label";
import { Button } from "../../button";

interface Props {
  disabled?: boolean;
  id: string;
  required?: boolean;
  onChange: (value: LatLngLiteral) => void;
  value: LatLngLiteral;
}

export default function LocationPicker({
  disabled,
  id,
  required,
  onChange,
  value,
}: Props) {
  const [currentInput, setCurrentInput] = useState<string>();
  const [currentValue, setCurrentValue] = useState<string>();
  const [showModal, setShowModal] = useState(false);

  const [lat, setLat] = useState<number>(51);
  const [lng, setLng] = useState<number>(13);

  useEffect(() => {
    if (lat && lng) {
      onChange({ lat, lng });
    }
  }, [lat, lng, onChange]);

  const handleBlur: FocusEventHandler<HTMLInputElement> = () => {
    if (!currentInput || !currentValue) {
      return;
    }

    if (currentInput === "lat") {
      setLat(parseFloat(currentValue));
    }

    if (currentInput === "lng") {
      setLng(parseFloat(currentValue));
    }

    setCurrentInput(undefined);
    setCurrentValue(undefined);
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
