import "./QuantityStepper.css";

interface QuantityStepperProps {
  quantity: number;
  min?: number;
  max?: number;
  onChange: (quantity: number) => void;
}

export default function QuantityStepper({ quantity, min = 1, max = 99, onChange }: QuantityStepperProps) {
  return (
    <div className="qty-stepper">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, quantity - 1))}
        disabled={quantity <= min}
        aria-label="Disminuir cantidad"
      >
        −
      </button>
      <span>{quantity}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, quantity + 1))}
        disabled={quantity >= max}
        aria-label="Aumentar cantidad"
      >
        +
      </button>
    </div>
  );
}
