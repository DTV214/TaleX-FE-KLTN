"use client";

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { adsApi } from '@/features/ads/api/ads-api';

interface AdAnalyticsChartProps {
  campaignId: string;
}

export function AdAnalyticsChart({ campaignId }: AdAnalyticsChartProps) {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['campaign-metrics', campaignId],
    queryFn: () => adsApi.getCampaignMetrics(campaignId),
    enabled: !!campaignId
  });

  const chartData = useMemo(() => {
    if (!metrics) return [];
    return metrics.map((m: any) => ({
      date: new Date(m.reportDate).toLocaleDateString('vi-VN'),
      views: m.impressions,
      clicks: m.clicks
    }));
  }, [metrics]);

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-slate-400">Đang tải dữ liệu biểu đồ...</div>;
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-slate-400">
        <p>Chưa có dữ liệu thống kê cho chiến dịch này.</p>
        <p className="text-xs mt-2">Biểu đồ sẽ xuất hiện khi có view/click đầu tiên.</p>
      </div>
    );
  }

  return (
    <div className="h-80 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
          <XAxis dataKey="date" stroke="#888" tick={{ fill: '#888', fontSize: 12 }} tickMargin={10} />
          <YAxis yAxisId="left" stroke="#D4AF37" tick={{ fill: '#888', fontSize: 12 }} />
          <YAxis yAxisId="right" orientation="right" stroke="#4ade80" tick={{ fill: '#888', fontSize: 12 }} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1a1a1c', borderColor: '#333', borderRadius: '8px' }}
            itemStyle={{ color: '#fff' }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Line yAxisId="left" type="monotone" name="Lượt Xem (Views)" dataKey="views" stroke="#D4AF37" activeDot={{ r: 8 }} strokeWidth={3} />
          <Line yAxisId="right" type="monotone" name="Lượt Click" dataKey="clicks" stroke="#4ade80" strokeWidth={3} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
