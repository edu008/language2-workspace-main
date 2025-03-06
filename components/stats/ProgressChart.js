import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ProgressChart = ({
  data,
  title,
  color = "#6e739e",
  gradientFrom = "#6e739e",
  gradientTo = "rgba(110, 115, 158, 0.1)",
  yAxisLabel = "Anzahl",
  xAxisDataKey = "date",
  className = "",
}) => {
  return (
    <Card className={`h-full card-hover ${className}`}>
      <CardHeader>
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={gradientFrom} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={gradientTo} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey={xAxisDataKey} 
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: '#8c91b6' }} 
              />
              <YAxis 
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: '#8c91b6' }} 
                label={{ 
                  value: yAxisLabel, 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fill: '#8c91b6', fontSize: 12 }
                }} 
              />
              <CartesianGrid 
                strokeDasharray="3 3" 
                vertical={false} 
                stroke="#e9eaf2" 
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e9eaf2',
                  borderRadius: '8px',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                }}
                labelStyle={{ color: '#484b6a', fontWeight: 600 }}
                itemStyle={{ color: color }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                fill="url(#colorGradient)"
                activeDot={{ r: 6, strokeWidth: 0, fill: color }}
                animationDuration={1500}
                animationBegin={100}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressChart;