export const Card = ({ children, className = '', padded = true }) => {
  return (
    <div className={`bg-[#111111] border border-white/6 rounded-2xl ${padded ? 'p-8' : ''} ${className}`}>
      {children}
    </div>
  )
}

export const CardHeader = ({ title, description, action }) => {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="space-y-1">
        {title && <h3 className="text-white font-semibold text-base">{title}</h3>}
        {description && <p className="text-white/40 text-xs">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export default Card
