import { convertSrjToGraphicsObject } from "@tscircuit/capacity-autorouter"
import type { SerializedHyperGraph } from "@tscircuit/hypergraph"
import type {
  Circle,
  GraphicsObject,
  Line,
  Point,
  Polygon,
  Rect,
  Text,
} from "graphics-debug"
import type { SimpleRouteJson } from "./simple-route-json"

type XY = { x: number; y: number }
type Bounds = { minX: number; maxX: number; minY: number; maxY: number }
type UnknownRecord = Record<string, unknown>

export type HypergraphRouteOverlayInput = {
  hypergraph: SerializedHyperGraph
  simpleRouteJson: SimpleRouteJson
}

export const visualizeSimpleRouteJsonOverHypergraph = ({
  hypergraph,
  simpleRouteJson,
}: HypergraphRouteOverlayInput): GraphicsObject => {
  const graphGraphics = getHypergraphGraphics(
    hypergraph,
    simpleRouteJson.bounds,
  )
  const routeGraphics = convertSrjToGraphicsObject(
    simpleRouteJson as any,
  ) as Partial<GraphicsObject>
  const bounds = getOverlayBounds(hypergraph, simpleRouteJson.bounds)
  const textY = bounds.maxY + getScale(bounds) * 0.6

  return {
    coordinateSystem: "cartesian",
    title: "SimpleRouteJson over SerializedHyperGraph",
    rects: [...graphGraphics.rects, ...(routeGraphics.rects ?? [])],
    polygons: [
      ...graphGraphics.polygons,
      ...(simpleRouteJson.outline
        ? [
            {
              points: simpleRouteJson.outline,
              stroke: "#1f2937",
              strokeWidth: getScale(bounds) * 0.04,
              fill: "rgba(255,255,255,0)",
              label: "srj outline",
            },
          ]
        : []),
    ],
    lines: [...graphGraphics.lines, ...(routeGraphics.lines ?? [])],
    circles: [...graphGraphics.circles, ...(routeGraphics.circles ?? [])],
    points: [...graphGraphics.points, ...(routeGraphics.points ?? [])],
    texts: [
      ...graphGraphics.texts,
      ...(routeGraphics.texts ?? []),
      {
        x: bounds.minX,
        y: textY,
        text: `regions=${hypergraph.regions.length} ports=${hypergraph.ports.length} connections=${simpleRouteJson.connections.length} traces=${simpleRouteJson.traces?.length ?? 0}`,
        anchorSide: "bottom_left",
        color: "#111827",
        fontSize: getScale(bounds) * 0.28,
      },
    ],
  }
}

const getHypergraphGraphics = (
  hypergraph: SerializedHyperGraph,
  routeBounds: Bounds,
): Required<
  Pick<
    GraphicsObject,
    "rects" | "polygons" | "lines" | "circles" | "points" | "texts"
  >
> => {
  const bounds = getOverlayBounds(hypergraph, routeBounds)
  const scale = getScale(bounds)
  const regionCenters = new Map<string, XY>()
  const portCenters = new Map<string, XY>()

  for (const port of hypergraph.ports) {
    const portCenter = getPointFromData(port.d)
    if (portCenter) portCenters.set(port.portId, portCenter)
  }

  for (const region of hypergraph.regions) {
    const regionShape = getRegionShape(region.d)
    if (regionShape.center) {
      regionCenters.set(region.regionId, regionShape.center)
      continue
    }

    const pointCenters = region.pointIds
      .map((pointId) => portCenters.get(pointId))
      .filter((point): point is XY => Boolean(point))

    if (pointCenters.length > 0) {
      regionCenters.set(region.regionId, averagePoints(pointCenters))
    }
  }

  const rects: Rect[] = []
  const polygons: Polygon[] = []
  const lines: Line[] = []
  const circles: Circle[] = []
  const points: Point[] = []
  const texts: Text[] = []

  for (const region of hypergraph.regions) {
    const regionShape = getRegionShape(region.d)
    const label = region.regionId

    if (regionShape.rect) {
      rects.push({
        ...regionShape.rect,
        stroke: "#64748b",
        fill: "rgba(148, 163, 184, 0.13)",
        label,
      })
    } else if (regionShape.polygon) {
      polygons.push({
        points: regionShape.polygon,
        stroke: "#64748b",
        strokeWidth: scale * 0.025,
        fill: "rgba(148, 163, 184, 0.12)",
        label,
      })
    } else {
      const center = regionCenters.get(region.regionId)
      if (center) {
        rects.push({
          center,
          width: scale * 0.18,
          height: scale * 0.18,
          stroke: "#64748b",
          fill: "rgba(148, 163, 184, 0.16)",
          label,
        })
      }
    }
  }

  for (const port of hypergraph.ports) {
    const portCenter = portCenters.get(port.portId)
    const region1Center = regionCenters.get(port.region1Id)
    const region2Center = regionCenters.get(port.region2Id)

    if (region1Center && region2Center) {
      lines.push({
        points: portCenter
          ? [region1Center, portCenter, region2Center]
          : [region1Center, region2Center],
        strokeColor: "#94a3b8",
        strokeWidth: scale * 0.018,
        strokeDash: `${scale * 0.06} ${scale * 0.05}`,
        label: port.portId,
      })
    }

    if (portCenter) {
      circles.push({
        center: portCenter,
        radius: scale * 0.07,
        fill: "#ffffff",
        stroke: "#334155",
        label: port.portId,
      })
    }
  }

  for (const solvedRoute of hypergraph.solvedRoutes ?? []) {
    const routePoints = solvedRoute.path
      .map((candidate) => portCenters.get(candidate.portId))
      .filter((point): point is XY => Boolean(point))

    if (routePoints.length >= 2) {
      lines.push({
        points: routePoints,
        strokeColor: solvedRoute.requiredRip ? "#dc2626" : "#0f766e",
        strokeWidth: scale * 0.035,
        label: solvedRoute.connection.connectionId,
      })
    }
  }

  return { rects, polygons, lines, circles, points, texts }
}

const getOverlayBounds = (
  hypergraph: SerializedHyperGraph,
  routeBounds: Bounds,
): Bounds => {
  const points: XY[] = [
    { x: routeBounds.minX, y: routeBounds.minY },
    { x: routeBounds.maxX, y: routeBounds.maxY },
  ]

  for (const region of hypergraph.regions) {
    const shape = getRegionShape(region.d)
    if (shape.center) points.push(shape.center)
    if (shape.rect) {
      points.push(
        {
          x: shape.rect.center.x - shape.rect.width / 2,
          y: shape.rect.center.y - shape.rect.height / 2,
        },
        {
          x: shape.rect.center.x + shape.rect.width / 2,
          y: shape.rect.center.y + shape.rect.height / 2,
        },
      )
    }
    if (shape.polygon) points.push(...shape.polygon)
  }

  for (const port of hypergraph.ports) {
    const point = getPointFromData(port.d)
    if (point) points.push(point)
  }

  return points.reduce(
    (acc, point) => ({
      minX: Math.min(acc.minX, point.x),
      maxX: Math.max(acc.maxX, point.x),
      minY: Math.min(acc.minY, point.y),
      maxY: Math.max(acc.maxY, point.y),
    }),
    {
      minX: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
    },
  )
}

const getScale = (bounds: Bounds) =>
  Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY, 1)

const getRegionShape = (
  data: unknown,
): {
  center?: XY
  rect?: Omit<Rect, "stroke" | "fill" | "label">
  polygon?: XY[]
} => {
  const record = asRecord(data)
  if (!record) return {}

  const rect = getRectFromRecord(record)
  if (rect) return { center: rect.center, rect }

  const polygon = getPolygonFromRecord(record)
  if (polygon) return { center: averagePoints(polygon), polygon }

  const center = getPointFromData(record)
  if (center) return { center }

  return {}
}

const getRectFromRecord = (
  record: UnknownRecord,
): Omit<Rect, "stroke" | "fill" | "label"> | null => {
  const rectRecord = asRecord(record.rect)
  if (rectRecord) {
    const nestedRect = getRectFromRecord(rectRecord)
    if (nestedRect) return nestedRect
  }

  const center = getPointFromData(record.center) ?? getPointFromData(record)
  const width = getNumber(record.width) ?? getNumber(record.w)
  const height = getNumber(record.height) ?? getNumber(record.h)

  if (center && width && height) {
    return {
      center,
      width,
      height,
      ccwRotationDegrees: getNumber(record.ccwRotationDegrees),
    }
  }

  const bounds = asRecord(record.bounds) ?? record
  const minX = getNumber(bounds.minX)
  const maxX = getNumber(bounds.maxX)
  const minY = getNumber(bounds.minY)
  const maxY = getNumber(bounds.maxY)

  if (
    minX !== undefined &&
    maxX !== undefined &&
    minY !== undefined &&
    maxY !== undefined
  ) {
    return {
      center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
      width: maxX - minX,
      height: maxY - minY,
    }
  }

  return null
}

const getPolygonFromRecord = (record: UnknownRecord): XY[] | null => {
  const maybePolygon =
    record.polygon ?? record.points ?? record.vertices ?? record.outline
  if (!Array.isArray(maybePolygon)) return null

  const points = maybePolygon
    .map((point) => getPointFromData(point))
    .filter((point): point is XY => Boolean(point))

  return points.length >= 3 ? points : null
}

const getPointFromData = (data: unknown): XY | null => {
  const record = asRecord(data)
  if (!record) return null

  const directX = getNumber(record.x)
  const directY = getNumber(record.y)
  if (directX !== undefined && directY !== undefined) {
    return { x: directX, y: directY }
  }

  for (const key of ["center", "point", "position", "pos"] as const) {
    const point = getPointFromData(record[key])
    if (point) return point
  }

  return null
}

const averagePoints = (points: XY[]): XY => {
  const sum = points.reduce(
    (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
    { x: 0, y: 0 },
  )

  return { x: sum.x / points.length, y: sum.y / points.length }
}

const getNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined

const asRecord = (value: unknown): UnknownRecord | null =>
  typeof value === "object" && value !== null ? (value as UnknownRecord) : null
