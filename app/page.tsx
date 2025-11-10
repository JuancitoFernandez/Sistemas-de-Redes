'use client';

import { useState, useEffect } from 'react';
import { Node, NetworkEvent } from '@/lib/types';
import { getKafkaSimulator } from '@/lib/kafka-simulator';
import { StatsOverview } from '@/components/stats-overview';
import { NodeCard } from '@/components/node-card';
import { LatencyChart } from '@/components/latency-chart';
import { EventLog } from '@/components/event-log';
import { ThemeToggle } from '@/components/theme-toggle';

export default function DashboardPage() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [events, setEvents] = useState<NetworkEvent[]>([]);

  useEffect(() => {
    const simulator = getKafkaSimulator();
    
    // Inicializar con los nodos actuales
    setNodes(simulator.getNodes());

    // Callback para manejar eventos
    const handleEvent = (event: NetworkEvent) => {
      // Actualizar estado de nodos desde el simulador (evita duplicaciones)
      setNodes(simulator.getNodes());

      // Agregar evento a la lista (todos los eventos)
      setEvents(prevEvents => {
        const newEvents = [event, ...prevEvents];
        // Mantener solo los últimos 50 eventos
        return newEvents.slice(0, 50);
      });
    };

    // Suscribirse a eventos
    simulator.subscribe(handleEvent);

    // Iniciar el simulador
    simulator.start();

    // Cleanup: desuscribirse y detener el simulador
    return () => {
      simulator.unsubscribe(handleEvent);
      simulator.stop();
    };
  }, []);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard de Monitoreo de Red</h1>
            <p className="text-muted-foreground mt-2">
              Monitoreo en tiempo real de la infraestructura de red
            </p>
          </div>
          <ThemeToggle />
        </header>

        {/* Panel de estadísticas generales */}
        <StatsOverview nodes={nodes} />

        {/* Grid de tarjetas de nodos */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {nodes.map((node) => (
            <NodeCard key={node.id} node={node} />
          ))}
        </div>

        {/* Layout de gráfico y log de eventos */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Gráfico de latencia */}
          <LatencyChart nodes={nodes} />

          {/* Log de eventos */}
          <EventLog events={events} />
        </div>
      </div>
    </div>
  );
}

