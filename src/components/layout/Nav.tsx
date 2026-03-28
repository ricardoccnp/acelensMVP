"use client";

import { useState } from "react";
import Link from "next/link";
import type { Circuit } from "@/types";

interface NavProps {
  circuit: Circuit;
  onCircuitChange: (c: Circuit) => void;
}

export function Nav({ circuit, onCircuitChange }: NavProps) {
  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-xl font-bold tracking-tight">
            <span className="text-green-600">Ace</span>
            <span className="text-gray-900">Lens</span>
          </span>
          <span className="text-[10px] font-medium bg-green-50 text-green-700 border border-green-200 rounded px-1.5 py-0.5 leading-none">
            BETA
          </span>
        </Link>

        {/* Circuit toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => onCircuitChange("ATP")}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
              circuit === "ATP"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            ATP
          </button>
          <button
            onClick={() => onCircuitChange("WTA")}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
              circuit === "WTA"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            WTA
          </button>
        </div>
      </div>
    </nav>
  );
}
