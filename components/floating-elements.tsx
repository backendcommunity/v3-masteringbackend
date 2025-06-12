"use client"

export function FloatingElements() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Floating geometric shapes */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-[#F4E04D]/20 rounded-full blur-xl float-animation"></div>
      <div
        className="absolute top-40 right-20 w-16 h-16 bg-[#13AECE]/30 rounded-lg rotate-45 float-animation"
        style={{ animationDelay: "2s" }}
      ></div>
      <div
        className="absolute bottom-40 left-20 w-12 h-12 bg-[#F47C7C]/25 rounded-full float-animation"
        style={{ animationDelay: "4s" }}
      ></div>
      <div
        className="absolute bottom-20 right-40 w-24 h-24 bg-[#90EE90]/20 rounded-lg rotate-12 float-animation"
        style={{ animationDelay: "1s" }}
      ></div>

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="grid grid-cols-12 gap-4 h-full">
          {Array.from({ length: 48 }).map((_, i) => (
            <div key={i} className="border border-white/10"></div>
          ))}
        </div>
      </div>
    </div>
  )
}
