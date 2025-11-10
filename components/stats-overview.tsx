'use client';

import { Node } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatsOverviewProps {
  nodes: Node[];
}

export function StatsOverview({ nodes }: StatsOverviewProps) {
  const onlineNodes = nodes.filter(n => n.status === 'online');
  const activeNodesCount = onlineNodes.length;
  const totalNodes = nodes.length;

  const averageLatency = onlineNodes.length > 0
    ? Math.round(
        onlineNodes.reduce((sum, node) => sum + node.latency, 0) / onlineNodes.length
      )
    : 0;

  const totalConnections = onlineNodes.reduce((sum, node) => sum + node.connections, 0);

  // Contar alarmas críticas (esto se calculará en el componente padre)
  // Por ahora, contamos nodos offline como críticos
  const criticalAlarms = nodes.filter(n => n.status === 'offline').length;

  const stats = [
    {
      title: 'Nodos Activos',
      value: `${activeNodesCount}/${totalNodes}`,
      description: 'Nodos en línea',
    },
    {
      title: 'Latencia Promedio',
      value: `${averageLatency}ms`,
      description: 'Red completa',
    },
    {
      title: 'Total Conexiones',
      value: totalConnections.toLocaleString(),
      description: 'Conexiones activas',
    },
    {
      title: 'Alarmas Críticas',
      value: criticalAlarms.toString(),
      description: 'Requieren atención',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

