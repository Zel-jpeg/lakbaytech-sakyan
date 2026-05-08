export default function CarSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="h-32 sm:h-48 shimmer" />
      <div className="p-2 sm:p-4 space-y-2 sm:space-y-3">
        <div className="h-3 sm:h-4 shimmer rounded-lg w-3/4" />
        <div className="h-2.5 sm:h-3 shimmer rounded-lg w-1/2" />
        <div className="h-2.5 sm:h-3 shimmer rounded-lg w-1/3" />
        <div className="pt-2 sm:pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center mt-2">
          <div className="h-4 sm:h-5 shimmer rounded-lg w-1/4" />
          <div className="h-6 sm:h-8 shimmer rounded-lg sm:rounded-xl w-16 sm:w-20" />
        </div>
      </div>
    </div>
  )
}
