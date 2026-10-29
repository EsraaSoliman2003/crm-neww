"use client";

export default function Loading() {
  return (
    <div className="flex items-center justify-center py-10">
      <div className="relative">
        {/* Outer Ring */}
        <div className="h-14 w-14 rounded-full border-4 border-orange-200" />

        {/* Animated Ring */}
        <div
          className="
            absolute inset-0
            h-14 w-14
            rounded-full
            border-4
            border-transparent
            border-t-orange-500
            animate-spin
          "
        />

        {/* Inner Dot */}
        <div
          className="
            absolute inset-0
            flex items-center justify-center
          "
        >
          <div className="h-3 w-3 rounded-full bg-orange-500 animate-pulse" />
        </div>
      </div>
    </div>
  );
}