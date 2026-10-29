"use client";

import React from "react";

type Props = {
  size?: number;
  fullScreen?: boolean;
};

export default function Loader({ size = 40, fullScreen = false }: Props) {
  return (
    <div
      className={`
        flex items-center justify-center
        ${fullScreen ? "min-h-screen" : "py-10"}
      `}
    >
      <div
        className="border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin"
        style={{ width: size, height: size }}
      />
    </div>
  );
}
