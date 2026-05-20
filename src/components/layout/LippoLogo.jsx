const LippoLogo = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: { brand: 'text-base', sub: 'text-[8px]', gap: 'mt-0.5' },
    md: { brand: 'text-xl', sub: 'text-[10px]', gap: 'mt-1' },
    lg: { brand: 'text-3xl', sub: 'text-xs', gap: 'mt-1.5' },
    xl: { brand: 'text-4xl', sub: 'text-sm', gap: 'mt-2' },
  }

  const s = sizes[size]

  return (
    <div className={`flex flex-col items-center leading-none select-none ${className}`}>
      <div className={`${s.brand} tracking-tight flex items-baseline`}>
        <span className="text-white font-black">LIPPO</span>
        <span className="text-white font-light">MALL</span>
      </div>
      <div className={`text-white/60 font-light tracking-[0.5em] ${s.sub} ${s.gap} pl-2`}>
        PURI
      </div>
    </div>
  )
}

export default LippoLogo
