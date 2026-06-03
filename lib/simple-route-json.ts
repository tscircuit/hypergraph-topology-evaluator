export type RouteLayerName = string

export type TerminalViaHint = {
  toLayer: RouteLayerName
  viaDiameter?: number
}

export type SingleLayerConnectionPoint = {
  x: number
  y: number
  layer: RouteLayerName
  pointId?: string
  pcb_port_id?: string
  terminalVia?: TerminalViaHint
}

export type MultiLayerConnectionPoint = {
  x: number
  y: number
  layers: RouteLayerName[]
  pointId?: string
  busId?: string
  pcb_port_id?: string
}

export type ConnectionPoint =
  | SingleLayerConnectionPoint
  | MultiLayerConnectionPoint

export type SimpleRouteObstacle = {
  obstacleId?: string
  componentId?: string
  type: "rect"
  layers: RouteLayerName[]
  zLayers?: number[]
  center: { x: number; y: number }
  width: number
  height: number
  ccwRotationDegrees?: number
  connectedTo: string[]
  isCopperPour?: boolean
  netIsAssignable?: boolean
  offBoardConnectsTo?: string[]
}

export type SimpleRouteConnection = {
  name: string
  source_trace_id?: string
  rootConnectionName?: string
  mergedConnectionNames?: string[]
  isOffBoard?: boolean
  netConnectionName?: string
  nominalTraceWidth?: number
  width?: number
  pointsToConnect: ConnectionPoint[]
  externallyConnectedPointIds?: string[][]
}

export type SimplifiedPcbTraceRoutePoint =
  | {
      route_type: "wire"
      x: number
      y: number
      width: number
      layer: RouteLayerName
    }
  | {
      route_type: "via"
      x: number
      y: number
      to_layer: RouteLayerName
      from_layer: RouteLayerName
      via_diameter?: number
      via_hole_diameter?: number
    }
  | {
      route_type: "jumper"
      start: { x: number; y: number }
      end: { x: number; y: number }
      footprint: "0603" | "1206" | "1206x4_pair"
      layer: RouteLayerName
    }
  | {
      route_type: "through_obstacle"
      start: { x: number; y: number }
      end: { x: number; y: number }
      from_layer: RouteLayerName
      to_layer: RouteLayerName
      width: number
    }

export type SimplifiedPcbTrace = {
  type: "pcb_trace"
  pcb_trace_id: string
  connection_name: string
  route: SimplifiedPcbTraceRoutePoint[]
}

export type SimpleRouteJson = {
  id?: string
  sourceCircuitJson?: string
  sourceKicadPcb?: string
  sourceName?: string
  sourceUrl?: string
  layerCount: number
  minTraceWidth: number
  nominalTraceWidth?: number
  minViaDiameter?: number
  minViaHoleDiameter?: number
  minViaPadDiameter?: number
  min_via_hole_diameter?: number
  min_via_pad_diameter?: number
  defaultObstacleMargin?: number
  minTraceToPadEdgeClearance?: number
  obstacles: SimpleRouteObstacle[]
  connections: SimpleRouteConnection[]
  bounds: { minX: number; maxX: number; minY: number; maxY: number }
  outline?: Array<{ x: number; y: number }>
  traces?: SimplifiedPcbTrace[] | unknown[]
  jumpers?:
    | Array<{
        jumper_footprint: "0603" | "1206x4"
        center: { x: number; y: number }
        orientation: "horizontal" | "vertical"
        width: number
        height: number
        pads: SimpleRouteObstacle[]
      }>
    | unknown[]
  allowJumpers?: boolean
  availableJumperTypes?: Array<"1206x4" | "0603">
}
