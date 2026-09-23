import type { Level } from "../types";
import { SORT_OPTIONS, type SortOption } from "../lib/products";
import { ChevronDownIcon } from "./Icons";
import "./FilterBar.css";

interface FilterBarProps {
  levels: Level[];
  brands: string[];
  activeLevel: string | null;
  activeBrand: string | null;
  onLevelChange: (slug: string | null) => void;
  onBrandChange: (brand: string | null) => void;
  sort?: SortOption;
  onSortChange?: (sort: SortOption) => void;
  resultCount?: number;
  loading?: boolean;
}

export default function FilterBar({
  levels,
  brands,
  activeLevel,
  activeBrand,
  onLevelChange,
  onBrandChange,
  sort,
  onSortChange,
  resultCount,
  loading,
}: FilterBarProps) {
  const hasFilters = activeLevel !== null || activeBrand !== null;

  return (
    <div className="filter-bar">
      {levels.length > 0 && (
        <div className="filter-group">
          <span className="filter-label">Colección</span>
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
      )}

      {brands.length > 1 && (
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

      {(sort !== undefined || resultCount !== undefined) && (
        <div className="filter-toolbar">
          <span className="filter-count" aria-live="polite">
            {loading ? (
              "Cargando productos…"
            ) : (
              <>
                <strong key={resultCount}>{resultCount}</strong> producto{resultCount === 1 ? "" : "s"}
                {hasFilters && (
                  <button
                    type="button"
                    className="filter-clear"
                    onClick={() => {
                      onLevelChange(null);
                      onBrandChange(null);
                    }}
                  >
                    Limpiar filtros
                  </button>
                )}
              </>
            )}
          </span>
          {sort !== undefined && onSortChange && (
            <label className="filter-sort">
              <span className="visually-hidden">Ordenar por</span>
              <select value={sort} onChange={(e) => onSortChange(e.target.value as SortOption)}>
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon size={16} />
            </label>
          )}
        </div>
      )}
    </div>
  );
}
