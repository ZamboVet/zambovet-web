'use client';

import React from 'react';
import { 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon,
  MinusIcon
} from '@heroicons/react/24/outline';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ElementType;
  format?: 'number' | 'currency' | 'percentage';
  loading?: boolean;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
}

export default function KPICard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  format = 'number',
  loading = false,
  color = 'blue'
}: KPICardProps) {
  
  const formatValue = (val: string | number) => {
    if (loading) return '---';
    
    const numValue = typeof val === 'string' ? parseFloat(val) : val;
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-PH', {
          style: 'currency',
          currency: 'PHP',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(numValue);
      
      case 'percentage':
        return `${numValue.toFixed(1)}%`;
      
      case 'number':
      default:
        return new Intl.NumberFormat('en-US').format(numValue);
    }
  };

  const getColorClasses = (colorName: string) => {
    const colors = {
      blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: 'text-blue-600',
        text: 'text-blue-900'
      },
      green: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        icon: 'text-green-600',
        text: 'text-green-900'
      },
      yellow: {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        icon: 'text-yellow-600',
        text: 'text-yellow-900'
      },
      red: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: 'text-red-600',
        text: 'text-red-900'
      },
      purple: {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        icon: 'text-purple-600',
        text: 'text-purple-900'
      },
      gray: {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        icon: 'text-gray-600',
        text: 'text-gray-900'
      }
    };

    return colors[colorName as keyof typeof colors] || colors.blue;
  };

  const getTrendIcon = () => {
    if (change === undefined || change === null) return null;
    
    if (change > 0) {
      return <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />;
    } else if (change < 0) {
      return <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />;
    } else {
      return <MinusIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTrendText = () => {
    if (change === undefined || change === null) return null;
    
    const absChange = Math.abs(change);
    const sign = change > 0 ? '+' : change < 0 ? '-' : '';
    const textColor = change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-500';
    
    return (
      <span className={`text-sm font-medium ${textColor}`}>
        {sign}{absChange.toFixed(1)}%
      </span>
    );
  };

  const colorClasses = getColorClasses(color);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
        </div>
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all duration-200 group">
      {/* Header with title and icon */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600 truncate">{title}</h3>
        {Icon && (
          <div className="p-2 bg-gray-50 rounded-lg">
            <Icon className="w-5 h-5 text-gray-600" />
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mb-3">
        <p className="text-3xl font-bold text-gray-900">
          {formatValue(value)}
        </p>
      </div>

      {/* Change indicator */}
      {(change !== undefined && change !== null) && (
        <div className="flex items-center space-x-2">
          {getTrendIcon()}
          {getTrendText()}
          {changeLabel && (
            <span className="text-sm text-gray-500">
              {changeLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}