'use client';

import React, { useState } from 'react';
import { 
  ChevronUpIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  format?: 'text' | 'number' | 'currency' | 'percentage' | 'date';
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  title?: string;
  searchable?: boolean;
  loading?: boolean;
  pageSize?: number;
  emptyMessage?: string;
}

export default function DataTable({
  columns,
  data,
  title,
  searchable = false,
  loading = false,
  pageSize = 10,
  emptyMessage = 'No data available'
}: DataTableProps) {
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const formatValue = (value: any, format: string = 'text') => {
    if (value === null || value === undefined) return '-';

    switch (format) {
      case 'number':
        return new Intl.NumberFormat('en-US').format(Number(value));
      
      case 'currency':
        return new Intl.NumberFormat('en-PH', {
          style: 'currency',
          currency: 'PHP',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(Number(value));
      
      case 'percentage':
        return `${Number(value).toFixed(1)}%`;
      
      case 'date':
        return new Date(value).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      
      case 'text':
      default:
        return String(value);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const filteredAndSortedData = React.useMemo(() => {
    let result = [...data];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(row => 
        Object.values(row).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply sorting
    if (sortField) {
      result.sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        let comparison = 0;
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        } else {
          comparison = String(aValue).localeCompare(String(bValue));
        }

        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return result;
  }, [data, searchTerm, sortField, sortDirection]);

  const paginatedData = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedData.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredAndSortedData.length / pageSize);

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <div className="w-4 h-4" />; // placeholder
    }
    
    return sortDirection === 'asc' 
      ? <ChevronUpIcon className="w-4 h-4" />
      : <ChevronDownIcon className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        {title && (
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          </div>
        )}
        <div className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex space-x-4 animate-pulse">
                {columns.map((_, colIndex) => (
                  <div key={colIndex} className="h-4 bg-gray-200 rounded flex-1"></div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      {(title || searchable) && (
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {title && (
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            )}
            {searchable && (
              <div className="relative max-w-xs">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      {filteredAndSortedData.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-900">{emptyMessage}</p>
          <p className="text-xs text-gray-500 mt-1">
            {searchTerm ? 'Try adjusting your search criteria' : 'Data will appear here when available'}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider
                        ${column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'}
                        ${column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}
                      `}
                      onClick={() => column.sortable && handleSort(column.key)}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{column.label}</span>
                        {column.sortable && getSortIcon(column.key)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedData.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900
                          ${column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'}
                        `}
                      >
                        {formatValue(row[column.key], column.format)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {Math.min((currentPage - 1) * pageSize + 1, filteredAndSortedData.length)} to{' '}
                {Math.min(currentPage * pageSize, filteredAndSortedData.length)} of{' '}
                {filteredAndSortedData.length} results
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 border rounded text-sm ${
                          currentPage === page
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}