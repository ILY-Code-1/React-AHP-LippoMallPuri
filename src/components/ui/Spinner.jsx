/** Centered loading spinner for page / section loading states. */
const Spinner = ({ label = 'Memuat...', className = '' }) => (
  <div className={`flex flex-col items-center justify-center gap-3 py-20 ${className}`}>
    <div className="w-7 h-7 border-2 border-white/15 border-t-white/70 rounded-full animate-spin" />
    {label && <p className="text-white/40 text-xs font-medium">{label}</p>}
  </div>
)

export default Spinner
