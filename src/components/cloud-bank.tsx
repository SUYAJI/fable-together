/**
 * Soft cloud edge where a night band meets the page (sizing in globals.css).
 * Ellipses extend past the sides and bottom, so after blurring only the top edge is soft
 * and the bottom meets the page colour exactly.
 */
const backRow = [
  [60, 120, 210, 52],
  [420, 110, 240, 56],
  [820, 118, 230, 54],
  [1220, 108, 250, 58],
]
const frontRow = [
  [-40, 150, 200, 60],
  [230, 140, 190, 58],
  [500, 152, 210, 56],
  [760, 138, 200, 62],
  [1030, 150, 210, 58],
  [1300, 140, 220, 60],
  [1520, 152, 180, 56],
]

export function CloudBank({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`cloud-bank ${className}`}
      viewBox="0 0 1440 170"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter id="cloud-soft" x="-10%" y="-60%" width="120%" height="220%">
          <feGaussianBlur stdDeviation="12" />
        </filter>
      </defs>
      <g fill="currentColor" filter="url(#cloud-soft)">
        <g opacity="0.55">
          {backRow.map(([cx, cy, rx, ry]) => (
            <ellipse key={`b${cx}`} cx={cx} cy={cy} rx={rx} ry={ry} />
          ))}
        </g>
        {frontRow.map(([cx, cy, rx, ry]) => (
          <ellipse key={`f${cx}`} cx={cx} cy={cy} rx={rx} ry={ry} />
        ))}
        <rect x="-100" y="158" width="1640" height="80" />
      </g>
    </svg>
  )
}
