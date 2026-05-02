export default function Avatar({ url, name, size = 'md' }) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  }

  if (url) {
    return (
      <img
        src={url}
        alt={name || 'Avatar'}
        className={`rounded-full object-cover ring-2 ring-white dark:ring-gray-800 shadow-sm ${sizes[size]}`}
      />
    )
  }

  return (
    <div className={`rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-300
                      flex items-center justify-center font-semibold
                      ring-2 ring-white dark:ring-gray-800 shadow-sm ${sizes[size]}`}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  )
}
