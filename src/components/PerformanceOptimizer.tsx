import React, { memo, Suspense, lazy, useEffect, useState } from 'react';
import { LoadingSpinner } from '@/components/LoadingStates';
import { performanceMonitor } from '@/utils/performanceMonitor';
import { apiCache } from '@/utils/cacheManager';

// Lazy loading wrapper with error boundary
export const LazyComponent = memo(({ 
  loader, 
  fallback = <LoadingSpinner />,
  ...props 
}: {
  loader: () => Promise<{ default: React.ComponentType<any> }>;
  fallback?: React.ReactNode;
  [key: string]: any;
}) => {
  const Component = lazy(loader);
  
  return (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  );
});

// Image optimization component
export const OptimizedImage = memo(({
  src,
  alt,
  width,
  height,
  className,
  loading = 'lazy',
  ...props
}: {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  loading?: 'lazy' | 'eager';
  [key: string]: any;
}) => {
  const [imgSrc, setImgSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Generate optimized image sources
    const generateSrcSet = () => {
      if (!width || !height) return src;
      
      // For demo purposes, we'll just use the original src
      // In production, you'd generate multiple sizes
      return src;
    };

    setImgSrc(generateSrcSet());
  }, [src, width, height]);

  const handleLoad = () => {
    setIsLoading(false);
    performanceMonitor.recordMetric('image_load_time', Date.now());
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    performanceMonitor.recordMetric('image_load_error', 1);
  };

  if (hasError) {
    return (
      <div 
        className={`bg-slate-100 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-slate-400 text-sm">Image unavailable</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div 
          className={`absolute inset-0 bg-slate-100 flex items-center justify-center ${className}`}
          style={{ width, height }}
        >
          <LoadingSpinner size="sm" text="" />
        </div>
      )}
      <img
        src={imgSrc}
        alt={alt}
        width={width}
        height={height}
        className={className}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </div>
  );
});

// Virtualized list component for large datasets
export const VirtualizedList = memo(({
  items,
  renderItem,
  itemHeight = 60,
  containerHeight = 400,
  overscan = 5
}: {
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  itemHeight?: number;
  containerHeight?: number;
  overscan?: number;
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );
  
  const visibleItems = items.slice(startIndex, endIndex + 1);
  const offsetY = startIndex * itemHeight;
  
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

// Debounced search component
export const DebouncedSearch = memo(({
  onSearch,
  placeholder = "Search...",
  delay = 300,
  className
}: {
  onSearch: (query: string) => void;
  placeholder?: string;
  delay?: number;
  className?: string;
}) => {
  const [query, setQuery] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query);
    }, delay);

    return () => clearTimeout(timer);
  }, [query, delay, onSearch]);

  return (
    <input
      type="text"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder={placeholder}
      className={className}
    />
  );
});

// Performance monitoring HOC
export function withPerformanceMonitoring<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) {
  return memo((props: P) => {
    useEffect(() => {
      const startTime = Date.now();
      
      return () => {
        const renderTime = Date.now() - startTime;
        performanceMonitor.recordMetric(`component_render_${componentName}`, renderTime);
      };
    }, []);

    return <WrappedComponent {...props} />;
  });
}

// Data fetching with caching HOC
export function withCaching<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  cacheKey: (props: P) => string,
  ttl?: number
) {
  return memo((props: P) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
      const key = cacheKey(props);
      const cachedData = apiCache.get(key);
      
      if (cachedData) {
        setData(cachedData);
        setLoading(false);
      } else {
        // Component should handle its own data fetching
        setLoading(false);
      }
    }, [props]);

    if (loading) {
      return <LoadingSpinner />;
    }

    return <WrappedComponent {...props} cachedData={data} />;
  });
}

// Bundle splitting utility
export const createAsyncComponent = (
  loader: () => Promise<{ default: React.ComponentType<any> }>,
  fallback: React.ReactNode = <LoadingSpinner />
) => {
  return lazy(loader);
};

// Performance-optimized table component
export const OptimizedTable = memo(({
  data,
  columns,
  onSort,
  sortColumn,
  sortDirection = 'asc',
  pageSize = 50,
  virtualized = false
}: {
  data: any[];
  columns: Array<{
    key: string;
    label: string;
    render?: (value: any, row: any) => React.ReactNode;
  }>;
  onSort?: (column: string) => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  pageSize?: number;
  virtualized?: boolean;
}) => {
  const [page, setPage] = useState(0);
  
  const paginatedData = data.slice(page * pageSize, (page + 1) * pageSize);
  
  const renderRow = (row: any, index: number) => (
    <tr key={index} className="border-b border-slate-100">
      {columns.map((column) => (
        <td key={column.key} className="px-4 py-3">
          {column.render 
            ? column.render(row[column.key], row)
            : row[column.key]
          }
        </td>
      ))}
    </tr>
  );

  const tableHeader = (
    <thead className="bg-slate-50">
      <tr>
        {columns.map((column) => (
          <th
            key={column.key}
            className="px-4 py-3 text-left cursor-pointer hover:bg-slate-100"
            onClick={() => onSort?.(column.key)}
          >
            <div className="flex items-center space-x-1">
              <span>{column.label}</span>
              {sortColumn === column.key && (
                <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );

  if (virtualized && data.length > 100) {
    return (
      <div className="border border-slate-200 rounded-lg">
        <table className="w-full">
          {tableHeader}
        </table>
        <VirtualizedList
          items={data}
          renderItem={renderRow}
          itemHeight={60}
          containerHeight={400}
        />
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <table className="w-full">
        {tableHeader}
        <tbody>
          {paginatedData.map((row, index) => renderRow(row, index))}
        </tbody>
      </table>
      
      {data.length > pageSize && (
        <div className="flex justify-center items-center space-x-2 py-4 bg-slate-50">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-3 py-1 bg-white border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-slate-600">
            Page {page + 1} of {Math.ceil(data.length / pageSize)}
          </span>
          <button
            onClick={() => setPage(Math.min(Math.ceil(data.length / pageSize) - 1, page + 1))}
            disabled={page >= Math.ceil(data.length / pageSize) - 1}
            className="px-3 py-1 bg-white border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
});

LazyComponent.displayName = 'LazyComponent';
OptimizedImage.displayName = 'OptimizedImage';
VirtualizedList.displayName = 'VirtualizedList';
DebouncedSearch.displayName = 'DebouncedSearch';
OptimizedTable.displayName = 'OptimizedTable';