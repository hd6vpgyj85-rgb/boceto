import "./LoadingSpinner.css";

export default function LoadingSpinner({ label = "Cargando…" }: { label?: string }) {
  return (
    <div className="loading-spinner-wrap">
      <span className="loading-spinner" />
      <span className="visually-hidden">{label}</span>
    </div>
  );
}
