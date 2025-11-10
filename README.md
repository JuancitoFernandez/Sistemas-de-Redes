# Dashboard de Monitoreo de Red

Dashboard en tiempo real para monitoreo de infraestructura de red, construido con Next.js 15, TypeScript, Tailwind CSS y shadcn/ui.

## Características

- **Monitoreo en tiempo real**: Simulación de 5 nodos de red con actualizaciones automáticas
- **Panel de estadísticas**: Métricas generales de la red
- **Tarjetas de nodos**: Estado individual de cada nodo con indicadores visuales
- **Gráfico de latencia**: Visualización de latencia histórica usando Recharts
- **Log de eventos**: Registro de eventos y alarmas del sistema

## Stack Tecnológico

- **Framework**: Next.js 15 (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS v4
- **Componentes UI**: shadcn/ui
- **Gráficos**: Recharts

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Ejecutar el servidor de desarrollo:
```bash
npm run dev
```

3. Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

## Estructura del Proyecto

```
/
├── app/
│   ├── page.tsx          # Dashboard principal
│   ├── layout.tsx        # Layout raíz
│   └── globals.css       # Estilos globales
├── components/
│   ├── node-card.tsx       # Tarjeta de estado de nodo
│   ├── latency-chart.tsx   # Gráfico de latencia
│   ├── event-log.tsx       # Log de eventos
│   ├── stats-overview.tsx  # Panel de estadísticas
│   └── ui/                 # Componentes shadcn/ui
└── lib/
    ├── kafka-simulator.ts  # Simulador de eventos
    ├── types.ts            # Definiciones de tipos
    └── utils.ts            # Utilidades
```

## Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run start` - Inicia el servidor de producción
- `npm run lint` - Ejecuta el linter

## Explicación del Código

### Arquitectura General

El dashboard utiliza una arquitectura basada en **patrón Observer (Pub/Sub)** para manejar eventos en tiempo real. El flujo de datos sigue este patrón:

1. **Simulador de Kafka** (`lib/kafka-simulator.ts`) genera eventos periódicamente
2. **Componentes suscritos** reciben eventos y actualizan la UI
3. **Estado reactivo** se mantiene sincronizado con React hooks

### Flujo de Datos

```
KafkaSimulator (Singleton)
    ↓ genera eventos cada 2 segundos
    ↓ notifica a suscriptores
DashboardPage (useEffect)
    ↓ actualiza estado de nodos y eventos
    ↓ pasa props a componentes hijos
Componentes (StatsOverview, NodeCard, LatencyChart, EventLog)
    ↓ renderizan datos actualizados
```

### Componentes Principales

#### 1. Dashboard Principal (`app/page.tsx`)

**Función**: Componente raíz que orquesta toda la aplicación.

**Características destacadas**:
- Utiliza `useEffect` para inicializar el simulador cuando el componente se monta
- Implementa patrón de suscripción para recibir eventos en tiempo real
- Gestiona el ciclo de vida del simulador (inicio/parada)
- Limpia recursos al desmontar el componente

```12:46:app/page.tsx
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
```

**Puntos clave**:
- **Singleton Pattern**: `getKafkaSimulator()` garantiza una única instancia
- **Gestión de memoria**: Limita eventos a los últimos 50 para evitar crecimiento ilimitado
- **Cleanup adecuado**: Desuscripción y parada del simulador previenen memory leaks

#### 2. Simulador de Kafka (`lib/kafka-simulator.ts`)

**Función**: Simula un sistema de mensajería tipo Kafka que genera eventos de red.

**Características destacadas**:

**Inicialización de Nodos**:
```15:44:lib/kafka-simulator.ts
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
```

**Ciclo de Actualización (Tick)**:
```64:143:lib/kafka-simulator.ts
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
```

**Puntos clave**:
- **Patrón Observer**: Sistema de suscripción con `subscribe()` y `unsubscribe()`
- **Simulación realista**: Cambios probabilísticos (10% cambio de estado)
- **Detección de alarmas**: Sistema de alertas automáticas basado en umbrales
- **Gestión de historial**: Mantiene solo los últimos 20 puntos de latencia (sliding window)

**Patrón Singleton**:
```198:206:lib/kafka-simulator.ts
// Instancia singleton
let simulatorInstance: KafkaSimulator | null = null;

export function getKafkaSimulator(): KafkaSimulator {
  if (!simulatorInstance) {
    simulatorInstance = new KafkaSimulator();
  }
  return simulatorInstance;
}
```

#### 3. Tarjeta de Nodo (`components/node-card.tsx`)

**Función**: Muestra el estado individual de cada nodo de red.

**Características destacadas**:
- Indicadores visuales de estado (online/offline/degraded)
- Cálculo de tendencia de latencia comparando valores recientes
- Badges de estado con colores semánticos

```39:58:components/node-card.tsx
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
```

#### 4. Panel de Estadísticas (`components/stats-overview.tsx`)

**Función**: Muestra métricas agregadas de toda la red.

**Cálculos realizados**:
- Nodos activos vs totales
- Latencia promedio (solo nodos online)
- Total de conexiones activas
- Alarmas críticas (nodos offline)

```10:48:components/stats-overview.tsx
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
```

#### 5. Gráfico de Latencia (`components/latency-chart.tsx`)

**Función**: Visualiza el historial de latencia de todos los nodos en tiempo real.

**Características destacadas**:
- Combina datos de múltiples nodos en un solo gráfico
- Soporta tema claro/oscuro
- Muestra últimos 20 puntos de datos
- Usa Recharts para renderizado eficiente

```35:60:components/latency-chart.tsx
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
```

**Puntos clave**:
- **Transformación de datos**: Convierte estructura de nodos a formato de gráfico
- **Manejo de datos faltantes**: Usa `null` cuando un nodo no tiene dato en un tiempo específico
- **Límite de datos**: Muestra solo los últimos 20 puntos para rendimiento

#### 6. Log de Eventos (`components/event-log.tsx`)

**Función**: Muestra un registro cronológico de todos los eventos del sistema.

**Características destacadas**:
- Iconos diferentes por tipo de evento
- Badges de severidad para alarmas (crítico/advertencia/info)
- Scroll automático con límite de altura
- Formateo de timestamps legibles

```13:52:components/event-log.tsx
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
```

### Tipos y Estructuras de Datos (`lib/types.ts`)

**Función**: Define la tipografía TypeScript para toda la aplicación.

**Tipos principales**:

```1:35:lib/types.ts
export type NodeState = 'online' | 'offline' | 'degraded';

export interface Node {
  id: string;
  name: string;
  status: NodeState;
  connections: number;
  latency: number;
  lastUpdate: number;
  latencyHistory: Array<{ time: number; latency: number }>;
}

export type EventType = 
  | 'NODE_STATUS_CHANGE' 
  | 'LATENCY_UPDATE' 
  | 'CONNECTION_CHANGE' 
  | 'ALARM';

export type AlarmSeverity = 'critical' | 'warning' | 'info';

export interface NetworkEvent {
  type: EventType;
  timestamp: number;
  nodeId: string;
  payload: any;
  metadata?: any;
}

export interface AlarmEvent extends NetworkEvent {
  type: 'ALARM';
  payload: {
    severity: AlarmSeverity;
    message: string;
  };
}
```

**Puntos clave**:
- **Type Safety**: TypeScript garantiza consistencia de datos
- **Union Types**: `NodeState` y `EventType` limitan valores posibles
- **Extensibilidad**: `AlarmEvent` extiende `NetworkEvent` para especialización

### Características Técnicas Destacadas

1. **Gestión de Estado Reactiva**: Uso de `useState` y `useEffect` para estado local
2. **Patrón Observer**: Sistema de suscripción para eventos en tiempo real
3. **Singleton Pattern**: Una única instancia del simulador en toda la app
4. **Memoria Optimizada**: Límites en historial (20 puntos) y eventos (50 eventos)
5. **Type Safety**: TypeScript para prevenir errores en tiempo de desarrollo
6. **Componentes Reutilizables**: Separación de responsabilidades por componente
7. **Responsive Design**: Layout adaptativo con Tailwind CSS (grid responsivo)

### Flujo de Eventos Detallado

1. **Inicialización**: El simulador crea 5 nodos con valores aleatorios
2. **Ciclo de Tick**: Cada 2 segundos, el simulador:
   - Evalúa cambios de estado (10% probabilidad)
   - Ajusta latencia (±50ms variación)
   - Modifica conexiones (±10 conexiones)
   - Verifica umbrales para alarmas
   - Emite eventos a suscriptores
3. **Recepción**: El dashboard recibe eventos y actualiza estado
4. **Renderizado**: Componentes se re-renderizan con nuevos datos
5. **Visualización**: UI se actualiza mostrando cambios en tiempo real

