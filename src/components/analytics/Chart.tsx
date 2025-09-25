'use client';

import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartProps {
  type: 'line' | 'bar' | 'doughnut';
  data: any[];
  title?: string;
  height?: number;
  loading?: boolean;
  options?: any;
  colors?: string[];
  xAxisKey?: string;
  yAxisKey?: string;
  labelKey?: string;
}

export default function Chart({
  type,
  data,
  title,
  height = 300,
  loading = false,
  options: customOptions,
  colors = [
    '#3B82F6', // blue
    '#10B981', // green  
    '#F59E0B', // yellow
    '#EF4444', // red
    '#8B5CF6', // purple
    '#06B6D4', // cyan
    '#F97316', // orange
    '#84CC16', // lime
    '#EC4899', // pink
    '#6B7280'  // gray
  ],
  xAxisKey = 'label',
  yAxisKey = 'value',
  labelKey = 'label'
}: ChartProps) {

  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return null;
    }

    switch (type) {
      case 'line':
      case 'bar':
        return {
          labels: data.map(item => item[xAxisKey]),
          datasets: [
            {
              label: title || 'Data',
              data: data.map(item => item[yAxisKey]),
              backgroundColor: type === 'bar' ? colors[0] + '80' : colors[0] + '20',
              borderColor: colors[0],
              borderWidth: 2,
              fill: type === 'line',
              tension: 0.4
            }
          ]
        };

      case 'doughnut':
        return {
          labels: data.map(item => item[labelKey]),
          datasets: [
            {
              data: data.map(item => item[yAxisKey]),
              backgroundColor: colors.slice(0, data.length),
              borderColor: '#ffffff',
              borderWidth: 2
            }
          ]
        };

      default:
        return null;
    }
  }, [data, type, colors, xAxisKey, yAxisKey, labelKey, title]);

  const chartOptions = useMemo(() => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: type === 'doughnut',
          position: 'bottom' as const,
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              size: 12,
              family: 'Inter, system-ui, sans-serif'
            }
          }
        },
        tooltip: {
          backgroundColor: '#374151',
          titleColor: '#F9FAFB',
          bodyColor: '#F9FAFB',
          borderColor: '#6B7280',
          borderWidth: 1,
          cornerRadius: 8,
          titleFont: {
            size: 12,
            weight: 'bold'
          },
          bodyFont: {
            size: 12
          },
          padding: 12,
          callbacks: {
            label: function(context: any) {
              if (type === 'doughnut') {
                const total = context.dataset.data.reduce((sum: number, val: number) => sum + val, 0);
                const percentage = ((context.raw / total) * 100).toFixed(1);
                return `${context.label}: ${context.formattedValue} (${percentage}%)`;
              }
              return `${context.dataset.label}: ${context.formattedValue}`;
            }
          }
        }
      },
      scales: type !== 'doughnut' ? {
        x: {
          grid: {
            display: false
          },
          border: {
            display: false
          },
          ticks: {
            font: {
              size: 11,
              family: 'Inter, system-ui, sans-serif'
            },
            color: '#6B7280'
          }
        },
        y: {
          grid: {
            color: '#F3F4F6',
            drawBorder: false
          },
          border: {
            display: false
          },
          ticks: {
            font: {
              size: 11,
              family: 'Inter, system-ui, sans-serif'
            },
            color: '#6B7280'
          }
        }
      } : undefined,
      elements: {
        point: {
          radius: 4,
          hoverRadius: 6,
          backgroundColor: '#ffffff',
          borderWidth: 2
        }
      }
    };

    return { ...baseOptions, ...customOptions };
  }, [type, customOptions]);

  const renderChart = () => {
    if (!chartData) return null;

    switch (type) {
      case 'line':
        return <Line data={chartData} options={chartOptions} />;
      case 'bar':
        return <Bar data={chartData} options={chartOptions} />;
      case 'doughnut':
        return <Doughnut data={chartData} options={chartOptions} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {title && (
          <div className="mb-4">
            <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          </div>
        )}
        <div className="animate-pulse" style={{ height: `${height}px` }}>
          <div className="h-full bg-gray-200 rounded flex items-center justify-center">
            <div className="text-gray-400 text-sm">Loading chart...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!chartData || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        )}
        <div 
          className="flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg"
          style={{ height: `${height}px` }}
        >
          <div className="text-center">
            <div className="text-gray-400 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-sm font-medium">No Data Available</p>
            <p className="text-xs text-gray-400">Data will appear here when available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <div style={{ height: `${height}px` }}>
        {renderChart()}
      </div>
    </div>
  );
}