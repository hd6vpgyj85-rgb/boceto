import { useState } from "react";
import { PlusIcon } from "./Icons";
import "./QuantityStepper.css";

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
}

export default function QuantityStepper({ value, onChange, min = 1, max = 99, size = "sm" }: QuantityStepperProps) {
  const [previous, setPrevious] = useState(value);
  const [direction, setDirection] = useState<"up" | "down">("up");
  if (value !== previous) {
    setDirection(value > previous ? "up" : "down");
    setPrevious(value);
  }

  return (
    <div className={`qty-stepper qty-stepper-${size}`}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Disminuir cantidad"
      >
        <span className="qty-stepper-minus" />
      </button>
      <span className="qty-stepper-value" aria-live="polite">
        <span key={value} className={`qty-stepper-number qty-${direction}`}>
          {value}
        </span>
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Aumentar cantidad"
      >
        <PlusIcon size={14} strokeWidth={2.6} />
      </button>
    </div>
  );
}
