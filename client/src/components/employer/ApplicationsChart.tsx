import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ApplicationData {
  date: string;
  applications: number;
}

interface ApplicationsChartProps {
  data: ApplicationData[];
}

export default function ApplicationsChart({ data }: ApplicationsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No application data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="applications" 
          stroke="#8884d8" 
          strokeWidth={2}
          name="Applications"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
