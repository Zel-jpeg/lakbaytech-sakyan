import { clsx } from 'clsx'

const VARIANTS = {
  blue:   'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  green:  'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
  red:    'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  yellow: 'bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
  gray:   'bg-gray-50 text-gray-700 border-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
}

export default function Badge({ children, variant = 'blue', className }) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border',
      VARIANTS[variant] || VARIANTS.blue,
      className
    )}>
      {children}
    </span>
  )
}
