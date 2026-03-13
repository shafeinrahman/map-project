export function ZoomBar({ zoom, min = 0, max = 18, onZoomChange }) {
  return (
    <div className="zoom-bar" aria-label="Zoom level">
      <span className="zoom-bar__label">{min}</span>
      <input
        className="zoom-bar__slider"
        type="range"
        min={min}
        max={max}
        step={0.1}
        value={zoom}
        onChange={(e) => onZoomChange(Number(e.target.value))}
        aria-label={`Zoom ${zoom.toFixed(1)}`}
      />
      <span className="zoom-bar__label">{max}</span>
      <span className="zoom-bar__value">{Number(zoom).toFixed(1)}</span>
    </div>
  )
}
