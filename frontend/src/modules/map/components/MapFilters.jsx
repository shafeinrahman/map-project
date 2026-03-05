export function MapFilters({
  businessStatus,
  onBusinessStatusChange,
  businessCategoryId,
  onBusinessCategoryChange,
  categories,
}) {
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
        Business category
        <select
          value={businessCategoryId}
          onChange={(event) => onBusinessCategoryChange(event.target.value)}
        >
          <option value="all">all categories</option>
          {categories.map((category) => (
            <option key={category.categoryId} value={String(category.categoryId)}>
              {category.name || `Category ${category.categoryId}`}
            </option>
          ))}
        </select>
      </label>

      {/*
      <label>
        POI type contains
        <input
          placeholder="ex: general"
          value={poiType}
          onChange={(event) => onPoiTypeChange(event.target.value)}
        />
      </label>
      */}
    </div>
  )
}
