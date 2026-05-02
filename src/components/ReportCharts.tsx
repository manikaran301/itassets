"use client";

import React, { useMemo, useEffect, useState } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { useTheme } from "@/components/ThemeProvider";

// IMPORTANT: We use a robust initialization pattern to handle both ESM and CJS 
// environments (Turbopack/Webpack) which Highcharts modules often struggle with.
if (typeof window !== "undefined") {
  try {
    const HighchartsMore = require("highcharts/highcharts-more");
    const SolidGauge = require("highcharts/modules/solid-gauge");
    const Accessibility = require("highcharts/modules/accessibility");

    // Handle different export patterns
    const initMore = HighchartsMore.default || HighchartsMore;
    const initGauge = SolidGauge.default || SolidGauge;
    const initAcc = Accessibility.default || Accessibility;

    if (typeof initMore === "function") initMore(Highcharts);
    if (typeof initGauge === "function") initGauge(Highcharts);
    if (typeof initAcc === "function") initAcc(Highcharts);
  } catch (e) {
    console.error("Highcharts module initialization failed:", e);
  }
}

interface ReportChartsProps {
  assetDistribution: { label: string; value: number }[];
  deviceMix: [string, number][];
  departmentSpread: [string, number][];
}

export function ReportCharts({
  assetDistribution,
  deviceMix,
  departmentSpread,
}: ReportChartsProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const textColor = isDark ? "#94a3b8" : "#64748b";
  const gridColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
  const primaryColor = "#3b82f6";
  const secondaryColor = "#a855f7";

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const commonOptions: Highcharts.Options = useMemo(() => ({
    chart: {
      backgroundColor: "transparent",
      style: {
        fontFamily: "inherit",
      },
      spacingTop: 20,
      spacingBottom: 20,
    },
    title: { text: "" },
    credits: { enabled: false },
    accessibility: { enabled: false },
    tooltip: {
      backgroundColor: isDark ? "#1e293b" : "#ffffff",
      borderColor: isDark ? "#334155" : "#e2e8f0",
      style: { color: isDark ? "#f1f5f9" : "#1e293b" },
      borderRadius: 12,
      shadow: true,
    },
    plotOptions: {
      series: {
        animation: {
          duration: 1000,
        },
      },
    },
  }), [isDark]);

  const distributionOptions: Highcharts.Options = {
    ...commonOptions,
    chart: {
      ...commonOptions.chart,
      type: "pie",
    },
    plotOptions: {
      pie: {
        innerSize: "65%",
        borderWidth: 0,
        borderRadius: 8,
        dataLabels: {
          enabled: true,
          format: "{point.name}: {point.percentage:.1f}%",
          style: {
            color: textColor,
            fontSize: "10px",
            fontWeight: "bold",
            textOutline: "none",
          },
        },
        showInLegend: true,
      },
    },
    legend: {
      itemStyle: { color: textColor, fontSize: "10px", fontWeight: "bold" },
      itemHoverStyle: { color: primaryColor },
    },
    series: [
      {
        type: "pie",
        name: "Assets",
        data: assetDistribution.map((item) => ({
          name: item.label,
          y: item.value,
          color: item.label === "Available" ? "#22c55e" : 
                 item.label === "Assigned" ? "#3b82f6" :
                 item.label === "In Repair" ? "#f59e0b" : "#94a3b8",
        })),
      },
    ],
  };

  const deviceMixOptions: Highcharts.Options = {
    ...commonOptions,
    chart: {
      ...commonOptions.chart,
      type: "column",
    },
    xAxis: {
      categories: deviceMix.map(([type]) => type.replace("_", " ").toUpperCase()),
      labels: { style: { color: textColor, fontSize: "9px", fontWeight: "bold" } },
      lineColor: gridColor,
      tickColor: gridColor,
    },
    yAxis: {
      title: { text: "" },
      gridLineColor: gridColor,
      labels: { style: { color: textColor, fontSize: "9px" } },
    },
    series: [
      {
        type: "column",
        name: "Units",
        color: secondaryColor,
        borderRadius: 6,
        data: deviceMix.map(([, count]) => count),
        showInLegend: false,
      },
    ],
  };

  const utilizationRate = useMemo(() => {
    const total = assetDistribution.reduce((acc, curr) => acc + curr.value, 0);
    const assigned = assetDistribution.find(d => d.label === "Assigned")?.value || 0;
    return total > 0 ? Math.round((assigned / total) * 100) : 0;
  }, [assetDistribution]);

  const gaugeOptions: Highcharts.Options = {
    ...commonOptions,
    chart: {
      ...commonOptions.chart,
      type: "solidgauge",
      height: "220px",
    },
    pane: {
      center: ["50%", "85%"],
      size: "100%",
      startAngle: -90,
      endAngle: 90,
      background: {
        backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
        innerRadius: "60%",
        outerRadius: "100%",
        shape: "arc",
        borderWidth: 0,
      } as any,
    },
    yAxis: {
      min: 0,
      max: 100,
      stops: [
        [0.1, "#3b82f6"], // blue
        [0.5, "#a855f7"], // purple
        [0.9, "#22c55e"], // green
      ],
      lineWidth: 0,
      tickWidth: 0,
      minorTickInterval: undefined,
      tickAmount: 2,
      title: {
        y: -70,
      },
      labels: {
        y: 16,
        style: { color: textColor, fontSize: "10px" }
      },
    },
    plotOptions: {
      solidgauge: {
        dataLabels: {
          y: 5,
          borderWidth: 0,
          useHTML: true,
          format: '<div style="text-align:center"><span style="font-size:24px;color:' + (isDark ? '#fff' : '#1e293b') + ';font-weight:900">{y}%</span><br/><span style="font-size:9px;color:#94a3b8;text-transform:uppercase;font-weight:bold">Utilization</span></div>'
        }
      }
    },
    series: [{
      type: 'solidgauge',
      name: 'Utilization',
      data: [utilizationRate],
    }]
  };

  if (!isMounted) return <div className="h-[300px] flex items-center justify-center text-muted-foreground animate-pulse">Loading Analytics...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="premium-card rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-6 text-muted-foreground/80 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Lifecycle Distribution
        </h3>
        <HighchartsReact highcharts={Highcharts} options={distributionOptions} />
      </div>

      <div className="premium-card rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-6 text-muted-foreground/80 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
          Hardware Portfolio Mix
        </h3>
        <HighchartsReact highcharts={Highcharts} options={deviceMixOptions} />
      </div>

      <div className="premium-card rounded-2xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
        <div className="flex items-center justify-between mb-8">
           <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/80 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Operational Efficiency
          </h3>
          <div className="text-right">
             <p className="text-[10px] font-black uppercase text-primary">Live Efficiency Score</p>
             <p className="text-[9px] text-muted-foreground italic font-medium">Updated every session</p>
          </div>
        </div>
        <div className="h-[250px] relative">
          <HighchartsReact highcharts={Highcharts} options={gaugeOptions} />
        </div>
      </div>
    </div>
  );
}
