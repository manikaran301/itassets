"use client";

import dynamic from "next/dynamic";
import React from "react";

// This wrapper is a Client Component, so it's allowed to use dynamic(..., { ssr: false })
const Charts = dynamic(
  () => import("./ReportCharts").then((mod) => mod.ReportCharts),
  { 
    ssr: false,
    loading: () => <div className="h-[400px] w-full bg-card animate-pulse rounded-[32px] border border-border flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Initializing Analytics Engine...</div>
  }
);

interface ReportChartsWrapperProps {
  assetDistribution: { label: string; value: number }[];
  deviceMix: [string, number][];
  departmentSpread: [string, number][];
}

export function ReportChartsWrapper(props: ReportChartsWrapperProps) {
  return <Charts {...props} />;
}
