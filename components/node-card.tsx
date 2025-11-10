'use client';

import { Node } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface NodeCardProps {
  node: Node;
}

export function NodeCard({ node }: NodeCardProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'online':
        return 'success';
      case 'degraded':
        return 'warning';
      case 'offline':
        return 'critical';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'online':
        return 'En Línea';
      case 'degraded':
        return 'Degradado';
      case 'offline':
        return 'Desconectado';
      default:
        return status;
    }
  };

  // Calcular tendencia de latencia
  const getLatencyTrend = () => {
    if (node.latencyHistory.length < 2) {
      return null;
    }

    const recent = node.latencyHistory.slice(-2);
    const previous = recent[0].latency;
    const current = recent[1].latency;

    if (current > previous + 10) {
      return 'up';
    } else if (current < previous - 10) {
      return 'down';
    }
    return 'stable';
  };

  const trend = getLatencyTrend();
  const TrendIcon = trend === 'up' ? ArrowUp : trend === 'down' ? ArrowDown : Minus;
  const trendColor = trend === 'up' ? 'text-red-500' : trend === 'down' ? 'text-green-500' : 'text-gray-500';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold">{node.name}</CardTitle>
        <Badge variant={getStatusVariant(node.status) as any}>
          {getStatusLabel(node.status)}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Latencia</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">{node.latency}ms</span>
              <TrendIcon className={`h-4 w-4 ${trendColor}`} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Conexiones</span>
            <span className="text-lg font-semibold">{node.connections}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Última actualización: {new Date(node.lastUpdate).toLocaleTimeString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}



