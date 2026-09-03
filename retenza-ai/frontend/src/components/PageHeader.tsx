"use client";

import React from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <header className="bg-white border-b border-[#EEE5DF] px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-40 shrink-0">
      {/* Title & Subtitle */}
      <div>
        <h2 className="text-xl font-bold text-[#1A1A1A] tracking-tight leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-[#7A6E68] mt-0.5 font-medium">
            {subtitle}
          </p>
        )}
      </div>

      {/* Right Action Bar */}
      {children && (
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {children}
        </div>
      )}
    </header>
  );
}
