export default function CarSkeleton() {
  return (
    <div className="bg-white dark:bg-[#1a1d2e] rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      <div className="aspect-[3/2] shimmer" />
      <div className="p-2.5 sm:p-4 space-y-2">
        <div className="h-3 sm:h-4 shimmer rounded-lg w-3/4" />
        <div className="h-2.5 sm:h-3 shimmer rounded-lg w-1/2" />
        <div className="hidden sm:flex gap-3 mt-1">
          <div className="h-3 shimmer rounded-lg w-16" />
          <div className="h-3 shimmer rounded-lg w-14" />
          <div className="h-3 shimmer rounded-lg w-16" />
        </div>
        <div className="flex sm:hidden gap-2 mt-1">
          <div className="h-2.5 shimmer rounded w-8" />
          <div className="h-2.5 shimmer rounded w-10" />
        </div>
        <div className="pt-2 sm:pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <div className="h-4 sm:h-5 shimmer rounded-lg w-16 sm:w-20" />
          <div className="h-6 sm:h-0 shimmer rounded-lg w-12 sm:w-0 sm:hidden" />
        </div>
      </div>
    </div>
  )
}
