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




