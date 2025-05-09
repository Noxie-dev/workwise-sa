import React from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

// Export individual chart components
export const JobCategoryBarChart = ({ data, colors }: { data: any[], colors: string[] }) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart
      data={data}
      margin={{ top: 5, right: 30, left: 20, bottom: 40 }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="category" angle={-45} textAnchor="end" height={70} />
      <YAxis />
      <Tooltip />
      <Legend />
      <Bar dataKey="count" fill="#8884d8" name="Available Jobs">
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
);

export const JobLocationPieChart = ({ data, colors }: { data: any[], colors: string[] }) => (
  <ResponsiveContainer width="100%" height="100%">
    <PieChart>
      <Pie
        data={data}
        dataKey="value"
        nameKey="name"
        cx="50%"
        cy="50%"
        outerRadius={80}
        fill="#8884d8"
        label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
        ))}
      </Pie>
      <Tooltip formatter={(value) => [`${value} jobs`, 'Count']} />
      <Legend />
    </PieChart>
  </ResponsiveContainer>
);

export const ApplicationTrendsLineChart = ({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height="100%">
    <LineChart
      data={data}
      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line
        type="monotone"
        dataKey="applications"
        stroke="#ff7300"
        name="Applications"
        strokeWidth={2}
        activeDot={{ r: 8 }}
      />
    </LineChart>
  </ResponsiveContainer>
);

// Default export for lazy loading
const ChartComponents = {
  JobCategoryBarChart,
  JobLocationPieChart,
  ApplicationTrendsLineChart
};

export default ChartComponents;
