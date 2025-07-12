import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface JobPerformanceData {
  jobTitle: string;
  views: number;
  applications: number;
}

interface JobManagementChartProps {
  data: JobPerformanceData[];
}

export default function JobManagementChart({ data }: JobManagementChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No job performance data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="jobTitle" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="views" fill="#8884d8" name="Views" />
        <Bar dataKey="applications" fill="#82ca9d" name="Applications" />
      </BarChart>
    </ResponsiveContainer>
  );
}
