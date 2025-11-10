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

