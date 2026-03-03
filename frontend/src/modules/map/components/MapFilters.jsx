export function MapFilters({ businessStatus, onBusinessStatusChange, poiType, onPoiTypeChange }) {
  return (
    <div className="filters-row">
      <label>
        Business status
        <select value={businessStatus} onChange={(event) => onBusinessStatusChange(event.target.value)}>
          <option value="all">all</option>
          <option value="active">active</option>
          <option value="inactive">inactive</option>
        </select>
      </label>

      <label>
        POI type contains
        <input
          placeholder="ex: general"
          value={poiType}
          onChange={(event) => onPoiTypeChange(event.target.value)}
        />
      </label>
    </div>
  )
}
