export default function CarSkeleton() {
  return (
    <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      <div className="aspect-[4/3] shimmer" />
      <div className="p-4 space-y-3">
        <div className="h-4 shimmer rounded-lg w-3/4" />
        <div className="h-3 shimmer rounded-lg w-1/2" />
        <div className="flex gap-3 mt-2">
          <div className="h-3 shimmer rounded-lg w-16" />
          <div className="h-3 shimmer rounded-lg w-14" />
          <div className="h-3 shimmer rounded-lg w-16" />
        </div>
        <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center mt-2">
          <div className="h-5 shimmer rounded-lg w-20" />
          <div className="h-8 shimmer rounded-xl w-20 sm:hidden" />
        </div>
      </div>
    </div>
  )
}
