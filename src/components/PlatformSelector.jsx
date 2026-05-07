export default function PlatformSelector({ label, value, onChange, platforms, placeholder }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide">
        {label}
      </label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white
          focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500
          appearance-none cursor-pointer"
        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
      >
        {placeholder && (
          <option value="">{placeholder}</option>
        )}
        {platforms.map(p => (
          <option key={p.value} value={p.value}>
            {p.icon} {p.label}
          </option>
        ))}
      </select>
    </div>
  );
}
