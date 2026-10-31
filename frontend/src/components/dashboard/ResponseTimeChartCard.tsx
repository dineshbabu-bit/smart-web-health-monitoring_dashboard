import { useState } from 'react';
import { Card } from '../ui/Card';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

const data = [
  { time: '10:00', value: 120 },
  { time: '10:05', value: 132 },
  { time: '10:10', value: 145 },
  { time: '10:15', value: 210 },
  { time: '10:20', value: 180 },
  { time: '10:25', value: 190 },
  { time: '10:30', value: 155 },
  { time: '10:35', value: 140 },
  { time: '10:40', value: 185 },
  { time: '10:45', value: 250 },
  { time: '10:50', value: 210 },
  { time: '10:55', value: 195 },
  { time: '11:00', value: 182 },
];

export const ResponseTimeChartCard = () => {
  const [timeRange, setTimeRange] = useState('24H');
  const ranges = ['1H', '6H', '24H', '7D', '30D'];

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="font-semibold text-white">Response Time</h3>
          <p className="text-xs text-zinc-400 mt-1">Average response time across all applications</p>
        </div>
        <div className="flex bg-[#121215] border border-zinc-800 rounded-lg p-1">
          {ranges.map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                timeRange === range
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis 
              dataKey="time" 
              stroke="#52525b" 
              fontSize={12} 
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#52525b" 
              fontSize={12} 
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}ms`}
            />
            <RechartsTooltip 
              contentStyle={{ 
                backgroundColor: '#18181b', 
                border: '1px solid #27272a',
                borderRadius: '8px',
                color: '#fff'
              }}
              itemStyle={{ color: '#10b981' }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#10b981" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorValue)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
