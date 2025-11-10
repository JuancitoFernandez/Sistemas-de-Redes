import { Node, NetworkEvent, AlarmEvent, NodeState, AlarmSeverity } from './types';

export class KafkaSimulator {
  private nodes: Map<string, Node>;
  private subscribers: Set<(event: NetworkEvent) => void>;
  private intervalId: NodeJS.Timeout | null = null;
  private tickInterval: number = 2000; // 2 segundos por defecto

  constructor() {
    this.nodes = new Map();
    this.subscribers = new Set();
    this.initializeNodes();
  }

  private initializeNodes(): void {
    const nodeNames = [
      'Node-US-East',
      'Node-US-West',
      'Node-EU-Central',
      'Node-Asia-Pacific',
      'Node-South-America'
    ];

    nodeNames.forEach((name, index) => {
      const node: Node = {
        id: `node-${index + 1}`,
        name,
        status: 'online',
        connections: Math.floor(Math.random() * 100) + 50,
        latency: Math.floor(Math.random() * 200) + 50,
        lastUpdate: Date.now(),
        latencyHistory: []
      };

      // Inicializar historial con algunos puntos
      for (let i = 0; i < 20; i++) {
        node.latencyHistory.push({
          time: Date.now() - (20 - i) * 2000,
          latency: Math.floor(Math.random() * 200) + 50
        });
      }

      this.nodes.set(node.id, node);
    });
  }

  public start(): void {
    if (this.intervalId) {
      return;
    }

    this.intervalId = setInterval(() => {
      this.tick();
    }, this.tickInterval);
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private tick(): void {
    this.nodes.forEach((node) => {
      const previousState = { ...node };

      // Simular cambio de estado (10% de probabilidad)
      if (Math.random() < 0.1) {
        node.status = this.getRandomState(node.status);
        if (node.status !== previousState.status) {
          this.emitEvent({
            type: 'NODE_STATUS_CHANGE',
            timestamp: Date.now(),
            nodeId: node.id,
            payload: {
              previousStatus: previousState.status,
              newStatus: node.status
            }
          });
        }
      }

      // Simular variación de latencia
      const latencyChange = (Math.random() - 0.5) * 100;
      const newLatency = Math.max(50, Math.min(500, node.latency + latencyChange));
      
      if (Math.abs(newLatency - node.latency) > 10) {
        node.latency = Math.round(newLatency);
        this.emitEvent({
          type: 'LATENCY_UPDATE',
          timestamp: Date.now(),
          nodeId: node.id,
          payload: {
            latency: node.latency
          }
        });

        // Verificar alarma de latencia
        if (node.latency > 300) {
          this.emitAlarm(node.id, 'warning', `Latencia alta detectada: ${node.latency}ms`);
        }
      }

      // Simular fluctuación de conexiones
      const connectionChange = Math.floor((Math.random() - 0.5) * 20);
      const newConnections = Math.max(0, node.connections + connectionChange);
      
      if (newConnections !== node.connections) {
        node.connections = newConnections;
        this.emitEvent({
          type: 'CONNECTION_CHANGE',
          timestamp: Date.now(),
          nodeId: node.id,
          payload: {
            connections: node.connections
          }
        });

        // Verificar alarma de conexiones
        if (node.connections < 50) {
          this.emitAlarm(node.id, 'info', `Conexiones bajas: ${node.connections}`);
        }
      }

      // Actualizar historial de latencia
      node.latencyHistory.push({
        time: Date.now(),
        latency: node.latency
      });

      // Mantener solo los últimos 20 puntos
      if (node.latencyHistory.length > 20) {
        node.latencyHistory.shift();
      }

      // Verificar alarma de nodo offline
      if (node.status === 'offline') {
        this.emitAlarm(node.id, 'critical', `Nodo ${node.name} está offline`);
      }

      node.lastUpdate = Date.now();
    });
  }

  private getRandomState(currentState: NodeState): NodeState {
    const states: NodeState[] = ['online', 'offline', 'degraded'];
    const availableStates = states.filter(s => s !== currentState);
    
    // 70% probabilidad de volver a online si está offline o degraded
    if (currentState !== 'online' && Math.random() < 0.7) {
      return 'online';
    }
    
    return availableStates[Math.floor(Math.random() * availableStates.length)];
  }

  private emitAlarm(nodeId: string, severity: AlarmSeverity, message: string): void {
    const alarm: AlarmEvent = {
      type: 'ALARM',
      timestamp: Date.now(),
      nodeId,
      payload: {
        severity,
        message
      }
    };
    this.emitEvent(alarm);
  }

  private emitEvent(event: NetworkEvent): void {
    this.subscribers.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error en callback de suscriptor:', error);
      }
    });
  }

  public subscribe(callback: (event: NetworkEvent) => void): void {
    this.subscribers.add(callback);
  }

  public unsubscribe(callback: (event: NetworkEvent) => void): void {
    this.subscribers.delete(callback);
  }

  public getNodes(): Node[] {
    return Array.from(this.nodes.values());
  }

  public getNode(nodeId: string): Node | undefined {
    return this.nodes.get(nodeId);
  }
}

// Instancia singleton
let simulatorInstance: KafkaSimulator | null = null;

export function getKafkaSimulator(): KafkaSimulator {
  if (!simulatorInstance) {
    simulatorInstance = new KafkaSimulator();
  }
  return simulatorInstance;
}



