"use client";

import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { adsApi } from '@/features/ads/api/ads-api';
import { ChevronDown, Calendar, Plus, Minus } from 'lucide-react';
import { DateRangePicker } from './date-range-picker';

// Add local format currency in case it's missing in some paths
function localFormatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value);
}

interface AdAnalyticsChartProps {
  campaignId: string;
}

const METRIC_CONFIG = {
  spend: { label: 'Total cost', color: '#3b82f6', yAxisId: 'left', unit: '₫' },
  impressions: { label: 'Impressions', color: '#10b981', yAxisId: 'left', unit: '' },
  clicks: { label: 'Clicks', color: '#8b5cf6', yAxisId: 'left', unit: '' },
  ctr: { label: 'CTR', color: '#06b6d4', yAxisId: 'right', unit: '%' },
  focusedViews6s: { label: 'View 6s', color: '#f59e0b', yAxisId: 'left', unit: '' },
  paidFocusedViews6s: { label: 'Paid View 6s', color: '#ec4899', yAxisId: 'left', unit: '' },
} as const;

type MetricKey = keyof typeof METRIC_CONFIG;
type SelectedMetric = MetricKey | 'none';

function formatDateForInput(date: Date) {
  const d = new Date(date);
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  const year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
}

export function AdAnalyticsChart({ campaignId }: AdAnalyticsChartProps) {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['campaign-metrics', campaignId],
    queryFn: () => adsApi.getCampaignMetrics(campaignId),
    enabled: !!campaignId
  });

  const [selectedMetrics, setSelectedMetrics] = useState<SelectedMetric[]>(['spend', 'none']);
  const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null);

  // Date filtering state
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return formatDateForInput(d);
  });
  const [endDate, setEndDate] = useState(() => formatDateForInput(new Date()));

  const addMetric = () => {
    setSelectedMetrics([...selectedMetrics, 'none']);
  };

  const removeMetric = (index: number) => {
    const newMetrics = [...selectedMetrics];
    newMetrics.splice(index, 1);
    setSelectedMetrics(newMetrics);
  };

  const updateMetric = (index: number, val: SelectedMetric) => {
    const newMetrics = [...selectedMetrics];
    newMetrics[index] = val;
    setSelectedMetrics(newMetrics);
  };

  const filteredChartData = useMemo(() => {
    if (!metrics) return [];
    
    // Sort chronologically first just in case
    const sorted = [...metrics].sort((a: any, b: any) => new Date(a.reportDate).getTime() - new Date(b.reportDate).getTime());
    
    // Apply date filter
    const startTime = new Date(startDate).getTime();
    const endTime = new Date(endDate).getTime();

    return sorted
      .filter((m: any) => {
        const time = new Date(m.reportDate).getTime();
        return time >= startTime && time <= endTime + 86400000; // Add 1 day to include end date fully
      })
      .map((m: any) => ({
        date: new Date(m.reportDate).toLocaleDateString('sv-SE'),
        impressions: m.impressions || 0,
        clicks: m.clicks || 0,
        focusedViews6s: m.focusedViews6s || 0,
        paidFocusedViews6s: m.paidFocusedViews6s || 0,
        spend: m.spend || 0,
        ctr: m.ctr ? Number(m.ctr.toFixed(2)) : 0,
        rawDate: m.reportDate
      }));
  }, [metrics, startDate, endDate]);

  const summary = useMemo(() => {
    if (!filteredChartData || filteredChartData.length === 0) return null;
    let totalSpend = 0, totalImpressions = 0, totalClicks = 0;
    filteredChartData.forEach(d => {
      totalSpend += d.spend;
      totalImpressions += d.impressions;
      totalClicks += d.clicks;
    });
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    return {
      totalCost: totalSpend,
      impressions: totalImpressions,
      clicks: totalClicks,
      ctr: ctr.toFixed(2)
    };
  }, [filteredChartData]);

  if (isLoading) {
    return (
      <div className="flex h-80 items-center justify-center animate-pulse">
        <div className="text-slate-400 font-medium">Loading data...</div>
      </div>
    );
  }

  if (!metrics || metrics.length === 0) {
    return (
      <div className="flex h-80 flex-col items-center justify-center text-slate-400">
        <p className="font-medium text-slate-600">No data available for this campaign</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Filter unique data points based on metric name in case user selected same metric twice
      const uniquePayload = payload.filter((v: any, i: number, a: any[]) => a.findIndex(t => (t.dataKey === v.dataKey)) === i);
      
      return (
        <div className="bg-white p-3 rounded shadow-md border border-slate-100 text-sm">
          <p className="font-medium text-slate-700 mb-2">{label}</p>
          {uniquePayload.map((entry: any, index: number) => {
            const config = METRIC_CONFIG[entry.dataKey as MetricKey];
            let val = entry.value;
            if (config.unit === '₫') val = localFormatCurrency(entry.value);
            else if (config.unit === '%') val = `${entry.value}%`;
            else val = new Intl.NumberFormat('vi-VN').format(entry.value);

            return (
              <div key={index} className="flex items-center gap-4 justify-between mb-1">
                <div className="flex items-center gap-1.5" style={{ color: entry.color }}>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  {config.label}
                </div>
                <span className="font-semibold text-slate-800">{val}</span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  const hasRightAxis = selectedMetrics.some(m => m !== 'none' && METRIC_CONFIG[m].yAxisId === 'right');
  const activeKeys = Array.from(new Set(selectedMetrics.filter(m => m !== 'none') as MetricKey[]));

  return (
    <div className="w-full flex flex-col font-sans bg-[#F9F9F9] min-h-screen">
      
      {/* View Data Header (mock to match screenshot) */}
      <div className="bg-white px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-800">View data</h2>
        </div>
        
        {/* Tabs and Date picker row */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex gap-6">
            <button className="text-sm font-semibold text-slate-800 border-b-2 border-black pb-2 -mb-[9px]">Daily</button>
            <button className="text-sm font-medium text-slate-400 pb-2">Audience</button>
          </div>
          <div className="flex items-center gap-2">
            <DateRangePicker 
              startDate={startDate} 
              endDate={endDate} 
              onChange={(start, end) => {
                setStartDate(start);
                setEndDate(end);
              }} 
            />
          </div>
        </div>

        {/* Summary Table */}
        {summary && (
          <div className="flex items-start gap-12 py-4">
            <div>
              <div className="text-xs text-slate-500 font-medium mb-1">Total cost</div>
              <div className="text-xl font-bold text-slate-800">{localFormatCurrency(summary.totalCost)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium mb-1">Impressions</div>
              <div className="text-xl font-bold text-slate-800">{new Intl.NumberFormat('vi-VN').format(summary.impressions)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium mb-1">Clicks</div>
              <div className="text-xl font-bold text-slate-800">{new Intl.NumberFormat('vi-VN').format(summary.clicks)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium mb-1">CTR</div>
              <div className="text-xl font-bold text-slate-800">{summary.ctr}%</div>
            </div>
          </div>
        )}
      </div>

      {/* Chart Section */}
      <div className="bg-white mt-4 mx-4 p-6 rounded border border-slate-100 shadow-sm">
        {/* Chart Header Tabs */}
        <div className="flex items-center gap-6 border-b border-slate-100 pb-3 mb-6">
          <button className="text-sm font-semibold text-slate-800 border-b-2 border-black pb-3 -mb-[13px]">Overall trends</button>
        </div>

        {/* Chart Toolbars (Dropdowns & Day/Hour toggle) */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-wrap gap-2 relative items-center">
            
            {selectedMetrics.map((metric, index) => (
              <div key={index} className="flex items-center gap-1 group relative">
                <button 
                  onClick={() => setOpenDropdownIndex(openDropdownIndex === index ? null : index)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded text-sm font-medium text-slate-700 transition-colors"
                >
                  {metric !== 'none' ? (
                    <>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: METRIC_CONFIG[metric].color }} />
                      {METRIC_CONFIG[metric].label}
                    </>
                  ) : (
                    <span className="text-slate-400 italic">Select Metric</span>
                  )}
                  <ChevronDown className="h-4 w-4 text-slate-400 ml-1" />
                </button>
                
                {/* Remove button */}
                {selectedMetrics.length > 1 && (
                  <button 
                    onClick={() => removeMetric(index)}
                    className="p-1 text-slate-300 hover:text-red-500 bg-slate-50 hover:bg-slate-100 rounded transition-colors"
                    title="Remove metric"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                )}

                {/* Dropdown Menu */}
                {openDropdownIndex === index && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpenDropdownIndex(null)} />
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-200 rounded shadow-lg z-50 py-1">
                      <button
                        onClick={() => { updateMetric(index, 'none'); setOpenDropdownIndex(null); }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-400 hover:bg-slate-50 italic"
                      >
                        Select Metric
                      </button>
                      {(Object.keys(METRIC_CONFIG) as MetricKey[]).map(key => (
                        <button
                          key={key}
                          onClick={() => { updateMetric(index, key); setOpenDropdownIndex(null); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${metric === key ? 'text-teal-600 font-medium bg-teal-50/30' : 'text-slate-700'}`}
                        >
                          {METRIC_CONFIG[key].label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}

            {selectedMetrics.length < 5 && (
              <button 
                onClick={addMetric}
                className="p-1.5 ml-1 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-teal-600 rounded transition-colors"
                title="Add metric"
              >
                <Plus className="h-4 w-4" />
              </button>
            )}

          </div>

          <div className="flex border border-slate-200 rounded overflow-hidden">
            <button className="px-3 py-1 text-xs font-medium text-[#fe2c55] bg-white border-r border-slate-200">Day</button>
            <button className="px-3 py-1 text-xs font-medium text-slate-400 bg-slate-50">Hour</button>
          </div>
        </div>

        {/* Chart Area */}
        {filteredChartData.length > 0 ? (
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={filteredChartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                
                <XAxis 
                  dataKey="date" 
                  axisLine={{ stroke: '#00D6BA', strokeWidth: 2 }} 
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  dy={10}
                />
                
                <YAxis 
                  yAxisId="left" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickFormatter={(val) => new Intl.NumberFormat('en-US', { notation: "compact" }).format(val)}
                />
                
                {hasRightAxis && (
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    tickFormatter={(val) => new Intl.NumberFormat('en-US', { notation: "compact" }).format(val)}
                  />
                )}
                
                <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }} />
                
                {selectedMetrics.map((metric, index) => {
                  if (metric === 'none') return null;
                  return (
                    <Line
                      key={`${metric}-${index}`}
                      yAxisId={METRIC_CONFIG[metric].yAxisId}
                      type="monotone"
                      dataKey={metric}
                      stroke={METRIC_CONFIG[metric].color}
                      strokeWidth={2}
                      dot={{ r: 3, strokeWidth: 1, fill: METRIC_CONFIG[metric].color }}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                      isAnimationActive={false}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[350px] w-full flex items-center justify-center text-slate-400">
            No data in this date range.
          </div>
        )}
      </div>

      {/* Detailed Analysis Table */}
      <div className="bg-white mt-4 mx-4 p-6 rounded border border-slate-100 shadow-sm mb-12">
        <h3 className="text-base font-bold text-slate-800 mb-4">Detailed analysis</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200">
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap border-r border-slate-200">Date</th>
                {activeKeys.map(key => (
                  <th key={key} className="px-4 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap border-r border-slate-200 last:border-0">
                    {METRIC_CONFIG[key].label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredChartData.length === 0 && (
                <tr>
                  <td colSpan={activeKeys.length + 1} className="px-4 py-8 text-center text-slate-400">
                    No data in this date range.
                  </td>
                </tr>
              )}
              {filteredChartData.map((row, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-700 border-r border-slate-100">{row.date}</td>
                  {activeKeys.map(key => {
                    const config = METRIC_CONFIG[key];
                    let val = row[key];
                    if (config.unit === '₫') val = localFormatCurrency(val);
                    else if (config.unit === '%') val = `${val}%`;
                    else val = new Intl.NumberFormat('vi-VN').format(val);
                    
                    return (
                      <td key={key} className="px-4 py-3 text-sm text-slate-600 border-r border-slate-100 last:border-0">
                        {val}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
