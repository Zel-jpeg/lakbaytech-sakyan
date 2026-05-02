export default function CarSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="h-48 shimmer" />
      <div className="p-4 space-y-3">
        <div className="h-4 shimmer rounded-lg w-3/4" />
        <div className="h-3 shimmer rounded-lg w-1/2" />
        <div className="h-3 shimmer rounded-lg w-1/3" />
        <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center mt-2">
          <div className="h-5 shimmer rounded-lg w-1/4" />
          <div className="h-8 shimmer rounded-xl w-20" />
        </div>
      </div>
    </div>
  )
}
