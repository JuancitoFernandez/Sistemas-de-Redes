'use client';

import { NetworkEvent, AlarmEvent } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Activity, Wifi, AlertTriangle, Info } from 'lucide-react';

interface EventLogProps {
  events: NetworkEvent[];
}

export function EventLog({ events }: EventLogProps) {
  const getEventIcon = (event: NetworkEvent) => {
    if (event.type === 'ALARM') {
      const alarm = event as AlarmEvent;
      switch (alarm.payload.severity) {
        case 'critical':
          return <AlertCircle className="h-4 w-4 text-red-500" />;
        case 'warning':
          return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
        case 'info':
          return <Info className="h-4 w-4 text-blue-500" />;
        default:
          return <AlertCircle className="h-4 w-4" />;
      }
    }

    switch (event.type) {
      case 'NODE_STATUS_CHANGE':
        return <Activity className="h-4 w-4 text-blue-500" />;
      case 'LATENCY_UPDATE':
        return <Activity className="h-4 w-4 text-green-500" />;
      case 'CONNECTION_CHANGE':
        return <Wifi className="h-4 w-4 text-purple-500" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getSeverityBadge = (event: NetworkEvent) => {
    if (event.type === 'ALARM') {
      const alarm = event as AlarmEvent;
      return (
        <Badge variant={alarm.payload.severity as any}>
          {alarm.payload.severity === 'critical' && 'Crítico'}
          {alarm.payload.severity === 'warning' && 'Advertencia'}
          {alarm.payload.severity === 'info' && 'Info'}
        </Badge>
      );
    }
    return null;
  };

  const getEventDescription = (event: NetworkEvent) => {
    if (event.type === 'ALARM') {
      const alarm = event as AlarmEvent;
      return alarm.payload.message;
    }

    switch (event.type) {
      case 'NODE_STATUS_CHANGE':
        return `Estado cambió de ${event.payload.previousStatus} a ${event.payload.newStatus}`;
      case 'LATENCY_UPDATE':
        return `Latencia actualizada: ${event.payload.latency}ms`;
      case 'CONNECTION_CHANGE':
        return `Conexiones: ${event.payload.connections}`;
      default:
        return 'Evento de red';
    }
  };

  const getNodeName = (nodeId: string) => {
    const nodeNames: Record<string, string> = {
      'node-1': 'Node-US-East',
      'node-2': 'Node-US-West',
      'node-3': 'Node-EU-Central',
      'node-4': 'Node-Asia-Pacific',
      'node-5': 'Node-South-America',
    };
    return nodeNames[nodeId] || nodeId;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registro de Eventos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {events.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No hay eventos registrados
            </div>
          ) : (
            events.map((event, index) => (
              <div
                key={`${event.timestamp}-${index}`}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="mt-0.5">{getEventIcon(event)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">
                      {getNodeName(event.nodeId)}
                    </span>
                    {getSeverityBadge(event)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {getEventDescription(event)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(event.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}


