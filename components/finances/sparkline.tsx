export function Sparkline({
  values,
  color,
  label,
}: {
  values: number[]
  color: string
  label: string
}) {
  const min = Math.min(0, ...values)
  const max = Math.max(0, ...values)
  const range = max - min || 1
  const step = 100 / (values.length - 1 || 1)
  const points = values.map((value, i) => {
    const x = Math.round(i * step * 10) / 10
    const y = Math.round((4 + (1 - (value - min) / range) * 32) * 10) / 10
    return `${x},${y}`
  })

  return (
    <svg
      width="100%"
      height="40"
      viewBox="0 0 100 40"
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
    >
      <path
        d={`M${points.join(' L')} L100,40 L0,40 Z`}
        fill={`${color}1f`}
      />
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
