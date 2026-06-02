import type { SerializedHyperGraph } from "@tscircuit/hypergraph"
import type { SimpleRouteJson } from "lib/simple-route-json"

export const simpleHypergraph: SerializedHyperGraph = {
  regions: [
    {
      regionId: "left-region",
      pointIds: ["p-left"],
      d: {
        center: { x: -2, y: 0 },
        width: 2,
        height: 1.5,
      },
    },
    {
      regionId: "middle-region",
      pointIds: ["p-left", "p-right"],
      d: {
        center: { x: 0, y: 0 },
        width: 2,
        height: 1.5,
      },
    },
    {
      regionId: "right-region",
      pointIds: ["p-right"],
      d: {
        center: { x: 2, y: 0 },
        width: 2,
        height: 1.5,
      },
    },
  ],
  ports: [
    {
      portId: "p-left",
      region1Id: "left-region",
      region2Id: "middle-region",
      d: { center: { x: -1, y: 0 } },
    },
    {
      portId: "p-right",
      region1Id: "middle-region",
      region2Id: "right-region",
      d: { center: { x: 1, y: 0 } },
    },
  ],
  connections: [
    {
      connectionId: "conn-a",
      startRegionId: "left-region",
      endRegionId: "right-region",
      mutuallyConnectedNetworkId: "net-a",
    },
  ],
  solvedRoutes: [
    {
      path: [
        {
          portId: "p-left",
          g: 0,
          h: 1,
          f: 1,
          hops: 0,
          ripRequired: false,
        },
        {
          portId: "p-right",
          g: 1,
          h: 0,
          f: 1,
          hops: 1,
          ripRequired: false,
        },
      ],
      connection: {
        connectionId: "conn-a",
        startRegionId: "left-region",
        endRegionId: "right-region",
        mutuallyConnectedNetworkId: "net-a",
      },
      requiredRip: false,
    },
  ],
}

export const simpleRouteJson: SimpleRouteJson = {
  layerCount: 2,
  minTraceWidth: 0.15,
  obstacles: [
    {
      obstacleId: "center-block",
      type: "rect",
      layers: ["top"],
      center: { x: 0, y: 0 },
      width: 0.45,
      height: 0.45,
      connectedTo: [],
    },
  ],
  connections: [
    {
      name: "net-a",
      pointsToConnect: [
        { x: -2.5, y: 0, layer: "top", pointId: "a" },
        { x: 2.5, y: 0, layer: "top", pointId: "b" },
      ],
    },
  ],
  bounds: { minX: -3, maxX: 3, minY: -1.5, maxY: 1.5 },
  traces: [
    {
      type: "pcb_trace",
      pcb_trace_id: "trace-a",
      connection_name: "net-a",
      route: [
        { route_type: "wire", x: -2.5, y: 0, width: 0.15, layer: "top" },
        { route_type: "wire", x: -0.5, y: 0.75, width: 0.15, layer: "top" },
        {
          route_type: "via",
          x: 0,
          y: 0.75,
          from_layer: "top",
          to_layer: "bottom",
        },
        { route_type: "wire", x: 0.5, y: 0.75, width: 0.15, layer: "bottom" },
        { route_type: "wire", x: 2.5, y: 0, width: 0.15, layer: "bottom" },
      ],
    },
  ],
}
