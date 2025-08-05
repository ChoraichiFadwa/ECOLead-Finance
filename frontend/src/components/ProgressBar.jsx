const ProgressBar = ({ value, max = 100, color = "primary", size = "md", showLabel = true }) => {
  const percentage = Math.min((value / max) * 100, 100)

  const colorClasses = {
    primary: "bg-primary-600",
    success: "bg-success-600",
    warning: "bg-warning-600",
    danger: "bg-danger-600",
  }

  const sizeClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  }

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700">Progression</span>
          <span className="text-sm text-gray-500">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={`progress-bar ${sizeClasses[size]}`}>
        <div className={`progress-fill ${colorClasses[color]}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
}

export default ProgressBar
