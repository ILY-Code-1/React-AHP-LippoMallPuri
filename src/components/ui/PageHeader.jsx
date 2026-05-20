const PageHeader = ({ title, subtitle, actions }) => {
  return (
    <div className="flex items-start justify-between gap-6 flex-wrap">
      <div className="space-y-1.5">
        <h1 className="text-white font-semibold text-2xl tracking-tight">{title}</h1>
        {subtitle && <p className="text-white/45 text-sm">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3 flex-wrap">{actions}</div>}
    </div>
  )
}

export default PageHeader
