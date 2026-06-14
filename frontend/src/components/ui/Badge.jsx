export function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-white/10 text-white',
    accent:  'bg-accent text-white',
    gold:    'bg-yellow-500/20 text-yellow-400',
    green:   'bg-green-500/20 text-green-400',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
