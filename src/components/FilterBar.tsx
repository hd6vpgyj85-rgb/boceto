import type { Level } from "../types";
import "./FilterBar.css";

interface FilterBarProps {
  levels: Level[];
  brands: string[];
  activeLevel: string | null;
  activeBrand: string | null;
  onLevelChange: (slug: string | null) => void;
  onBrandChange: (brand: string | null) => void;
}

export default function FilterBar({
  levels,
  brands,
  activeLevel,
  activeBrand,
  onLevelChange,
  onBrandChange,
}: FilterBarProps) {
  return (
    <div className="filter-bar">
      <div className="filter-group">
        <span className="filter-label">Nivel</span>
        <div className="chip-row">
          <button
            type="button"
            className={`chip ${activeLevel === null ? "chip-active" : ""}`}
            onClick={() => onLevelChange(null)}
          >
            Todas
          </button>
          {levels.map((level) => (
            <button
              key={level.slug}
              type="button"
              className={`chip ${activeLevel === level.slug ? "chip-active" : ""}`}
              onClick={() => onLevelChange(level.slug)}
            >
              {level.label}
            </button>
          ))}
        </div>
      </div>

      {brands.length > 0 && (
        <div className="filter-group">
          <span className="filter-label">Marca</span>
          <div className="chip-row">
            <button
              type="button"
              className={`chip ${activeBrand === null ? "chip-active" : ""}`}
              onClick={() => onBrandChange(null)}
            >
              Todas
            </button>
            {brands.map((brand) => (
              <button
                key={brand}
                type="button"
                className={`chip ${activeBrand === brand ? "chip-active" : ""}`}
                onClick={() => onBrandChange(brand)}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
