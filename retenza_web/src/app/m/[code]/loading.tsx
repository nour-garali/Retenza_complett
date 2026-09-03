export default function MerchantLandingLoading() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      {/* Hero skeleton */}
      <div className="h-72 bg-gray-300 rounded-b-none relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
        {/* Top bar skeleton */}
        <div className="flex items-center justify-between px-5 pt-5">
          <div className="h-5 w-28 bg-white/20 rounded-full" />
          <div className="h-5 w-20 bg-white/20 rounded-full" />
        </div>
        {/* Center content skeleton */}
        <div className="flex flex-col items-center mt-8 gap-4">
          <div className="w-24 h-24 rounded-3xl bg-white/20" />
          <div className="h-4 w-28 bg-white/20 rounded-full" />
          <div className="h-8 w-52 bg-white/20 rounded-full" />
          <div className="h-4 w-64 bg-white/20 rounded-full" />
          <div className="h-4 w-48 bg-white/20 rounded-full" />
        </div>
      </div>

      {/* Program card skeleton */}
      <div className="mx-5 mt-5 bg-white rounded-3xl border border-gray-100 p-5">
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-50">
          <div className="w-10 h-10 rounded-2xl bg-gray-100" />
          <div className="flex flex-col gap-2">
            <div className="h-4 w-40 bg-gray-100 rounded-full" />
            <div className="h-3 w-56 bg-gray-100 rounded-full" />
          </div>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-gray-100" />
          ))}
        </div>
      </div>

      {/* Form skeleton */}
      <div className="mx-5 mt-5 bg-white rounded-3xl border border-gray-100 p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-gray-100" />
          <div className="flex flex-col gap-2">
            <div className="h-4 w-32 bg-gray-100 rounded-full" />
            <div className="h-3 w-44 bg-gray-100 rounded-full" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="h-12 bg-gray-100 rounded-2xl" />
          <div className="h-12 bg-gray-100 rounded-2xl" />
        </div>
        <div className="h-12 bg-gray-100 rounded-2xl mb-3" />
        <div className="h-12 bg-gray-100 rounded-2xl mb-4" />
        <div className="h-14 bg-gray-200 rounded-2xl" />
      </div>

      {/* Footer skeleton */}
      <div className="mx-5 mt-6 mb-8 flex flex-col items-center gap-3">
        <div className="h-px w-full bg-gray-100" />
        <div className="h-4 w-36 bg-gray-100 rounded-full" />
        <div className="h-9 w-52 bg-gray-100 rounded-2xl" />
        <div className="h-3 w-48 bg-gray-100 rounded-full" />
      </div>

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
