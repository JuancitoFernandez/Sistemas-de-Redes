'use client';

import { Node } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from '@/lib/theme-provider';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface LatencyChartProps {
  nodes: Node[];
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
];

export function LatencyChart({ nodes }: LatencyChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  // Preparar datos para el gráfico
  // Necesitamos combinar todos los puntos de tiempo y crear una serie por nodo
  const prepareChartData = () => {
    // Obtener todos los tiempos únicos de todos los nodos
    const allTimes = new Set<number>();
    nodes.forEach(node => {
      node.latencyHistory.forEach(point => {
        allTimes.add(point.time);
      });
    });

    const sortedTimes = Array.from(allTimes).sort((a, b) => a - b);
    
    // Crear un objeto por cada tiempo con la latencia de cada nodo
    return sortedTimes.map(time => {
      const dataPoint: any = {
        time: new Date(time).toLocaleTimeString(),
        timestamp: time,
      };

      nodes.forEach((node, index) => {
        const point = node.latencyHistory.find(p => p.time === time);
        dataPoint[node.name] = point ? point.latency : null;
      });

      return dataPoint;
    }).slice(-20); // Últimos 20 puntos
  };

  const chartData = prepareChartData();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monitor de Latencia de Red</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={isDark ? '#374151' : '#e5e7eb'} 
            />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 12, fill: isDark ? '#9ca3af' : '#6b7280' }}
              interval="preserveStartEnd"
              stroke={isDark ? '#9ca3af' : '#6b7280'}
            />
            <YAxis 
              label={{ value: 'Latencia (ms)', angle: -90, position: 'insideLeft', fill: isDark ? '#9ca3af' : '#6b7280' }}
              tick={{ fontSize: 12, fill: isDark ? '#9ca3af' : '#6b7280' }}
              stroke={isDark ? '#9ca3af' : '#6b7280'}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: isDark ? '#1f2937' : 'white', 
                border: isDark ? '1px solid #374151' : '1px solid #ccc',
                color: isDark ? '#f3f4f6' : '#111827'
              }}
              labelStyle={{ color: isDark ? '#f3f4f6' : '#111827' }}
            />
            <Legend 
              wrapperStyle={{ color: isDark ? '#f3f4f6' : '#111827' }}
            />
            {nodes.map((node, index) => (
              <Line
                key={node.id}
                type="monotone"
                dataKey={node.name}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

