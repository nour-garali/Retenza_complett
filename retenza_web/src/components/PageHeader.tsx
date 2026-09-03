"use client";

import React from "react";
import { Download, ChevronDown } from "lucide-react";

interface PageHeaderProps {
  title: string;
  /** Optional subtitle shown below the title */
  subtitle?: string;
  /** Optional breadcrumb leaf label — defaults to title */
  breadcrumb?: string;
  /** Action controls injected to the right (selects, buttons, etc.) */
  children?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, breadcrumb, children }: PageHeaderProps) {
  const crumb = breadcrumb ?? title;

  // Split title: everything before the last word group goes black, last group goes red
  // For a simple effect: first word(s) black, last "word" red — pages can pass a split via breadcrumb
  const words = title.split(" ");
  const redPart  = words.slice(-2).join(" ");   // last 2 words in red
  const blackPart = words.slice(0, -2).join(" "); // rest in black

  return (
    <header className="relative bg-[#F7F5F2] sticky top-0 z-30 shrink-0 border-b border-gray-200/70 mb-6">
      
      {/* Background container with overflow-hidden just for the decorative wave */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute right-0 top-0 h-full w-72 select-none opacity-[0.05]">
          <svg viewBox="0 0 300 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
            <path d="M300 0 C220 40, 200 80, 300 120"  stroke="#dc2626" strokeWidth="60" strokeLinecap="round"/>
            <path d="M300 0 C240 30, 230 70, 300 110"  stroke="#dc2626" strokeWidth="30" strokeLinecap="round"/>
            <path d="M280 20 C230 50, 220 80, 280 120" stroke="#dc2626" strokeWidth="20" strokeLinecap="round"/>
          </svg>
        </div>
      </div>

      <div className="relative px-8 pt-4 pb-3 max-w-7xl mx-auto w-full">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 mb-2">
          <span className="text-[12px] text-gray-400 font-medium">Dashboard</span>
          <span className="text-[12px] text-gray-300 mx-0.5">/</span>
          <span className="text-[12px] text-[#dc2626] font-semibold">{crumb}</span>
        </nav>

        {/* Title row + right actions */}
        <div className="flex items-start justify-between gap-6">
          {/* Left */}
          <div className="flex-1 min-w-0">
            <h1 className="text-[24px] font-bold leading-tight tracking-tight">
              {blackPart && <span className="text-[#1B100C]">{blackPart} </span>}
              <span className="text-[#dc2626]">{redPart}</span>
            </h1>

            {subtitle && (
              <p className="text-[13px] text-[#9C8B82] mt-1 leading-snug max-w-xl font-normal">
                {subtitle}
              </p>
            )}
          </div>

          {/* Right: children (selects, buttons…) */}
          {children && (
            <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-1">
              {children}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
