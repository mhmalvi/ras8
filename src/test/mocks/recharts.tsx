import React from 'react';

// Mock Recharts components for testing
export const ResponsiveContainer = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="responsive-container" style={{ width: '100%', height: 400 }}>
    {children}
  </div>
);

export const PieChart = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="pie-chart">{children}</div>
);

export const Pie = ({ dataKey }: { dataKey?: string }) => (
  <div data-testid="pie" data-key={dataKey} />
);

export const Cell = ({ fill }: { fill?: string }) => (
  <div data-testid="cell" data-fill={fill} />
);

export const LineChart = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="line-chart">{children}</div>
);

export const Line = ({ dataKey, stroke }: { dataKey?: string; stroke?: string }) => (
  <div data-testid="line" data-key={dataKey} data-stroke={stroke} />
);

export const XAxis = ({ dataKey }: { dataKey?: string }) => (
  <div data-testid="x-axis" data-key={dataKey} />
);

export const YAxis = ({ dataKey }: { dataKey?: string }) => (
  <div data-testid="y-axis" data-key={dataKey} />
);

export const CartesianGrid = ({ strokeDasharray }: { strokeDasharray?: string }) => (
  <div data-testid="cartesian-grid" data-stroke-dasharray={strokeDasharray} />
);

export const Tooltip = ({ formatter }: { formatter?: (value: any) => any }) => (
  <div data-testid="tooltip" />
);

export const Legend = () => <div data-testid="legend" />;

export const BarChart = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="bar-chart">{children}</div>
);

export const Bar = ({ dataKey, fill }: { dataKey?: string; fill?: string }) => (
  <div data-testid="bar" data-key={dataKey} data-fill={fill} />
);

export const AreaChart = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="area-chart">{children}</div>
);

export const Area = ({ dataKey, fill }: { dataKey?: string; fill?: string }) => (
  <div data-testid="area" data-key={dataKey} data-fill={fill} />
);

// Export all components as default to match the original recharts structure
export default {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  AreaChart,
  Area,
};