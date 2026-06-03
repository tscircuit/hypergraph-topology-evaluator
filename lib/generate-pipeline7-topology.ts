import {
  AutoroutingPipelineSolver4_TinyHypergraph,
  AutoroutingPipelineSolver7_MultiGraph,
} from "@tscircuit/capacity-autorouter"
import {
  convertConnectionsToSerializedConnections,
  convertHyperGraphToSerializedHyperGraph,
  type SerializedHyperGraph,
} from "@tscircuit/hypergraph"
import type { GraphicsObject, Polygon, Rect } from "graphics-debug"
import type { SimpleRouteJson } from "./simple-route-json"

export type Pipeline7TopologyGenerationResult = {
  hypergraph: SerializedHyperGraph
  simpleRouteJson: SimpleRouteJson
  inputGraphics: GraphicsObject
  topologyGraphics: GraphicsObject
  pipelineSolver: AutoroutingPipelineSolver7_MultiGraph
  steps: number
  phase: string
}

export type GeneratePipeline7TopologyOptions = {
  maxSteps?: number
  effort?: number
  onProgress?: (progress: {
    steps: number
    phase: string
    activeSolverName?: string
  }) => void | Promise<void>
  yieldEverySteps?: number
}

export const generatePipeline7Topology = async (
  simpleRouteJson: SimpleRouteJson,
  opts: GeneratePipeline7TopologyOptions = {},
): Promise<Pipeline7TopologyGenerationResult> => {
  const maxSteps = opts.maxSteps ?? 250_000
  const yieldEverySteps = opts.yieldEverySteps ?? 100
  const pipelineSolver = new AutoroutingPipelineSolver7_MultiGraph(
    simpleRouteJson as any,
    {
      effort: opts.effort ?? 0.02,
      cacheProvider: null,
    },
  )
  const pipeline4ReferenceSolver =
    new AutoroutingPipelineSolver4_TinyHypergraph(simpleRouteJson as any, {
      effort: opts.effort ?? 0.02,
      cacheProvider: null,
    })
  const inputGraphics = pipeline4ReferenceSolver.visualize()

  let steps = 0
  while (
    !pipelineSolver.portPointPathingSolver &&
    !pipelineSolver.failed &&
    steps < maxSteps
  ) {
    pipelineSolver.step()
    steps += 1

    if (steps % yieldEverySteps === 0) {
      await opts.onProgress?.({
        steps,
        phase: pipelineSolver.getCurrentPhase(),
        activeSolverName: pipelineSolver.activeSubSolver?.getSolverName?.(),
      })
      await new Promise((resolve) => setTimeout(resolve, 0))
    }
  }

  if (pipelineSolver.failed) {
    throw new Error(
      pipelineSolver.error ?? "Pipeline7 failed before portPointPathingSolver",
    )
  }

  if (!pipelineSolver.portPointPathingSolver) {
    throw new Error(
      `Pipeline7 did not reach portPointPathingSolver within ${maxSteps} steps`,
    )
  }

  const [pathingParams] =
    pipelineSolver.portPointPathingSolver.getConstructorParams()
  const topologyGraphics = createPipeline4ReferenceTopologyGraphics(
    pipelineSolver.portPointPathingSolver.visualize(),
  )
  const hypergraph: SerializedHyperGraph = {
    ...convertHyperGraphToSerializedHyperGraph(pathingParams.graph),
    connections: convertConnectionsToSerializedConnections(
      pathingParams.connections,
    ),
  }

  await opts.onProgress?.({
    steps,
    phase: pipelineSolver.getCurrentPhase(),
    activeSolverName: pipelineSolver.activeSubSolver?.getSolverName?.(),
  })

  return {
    hypergraph,
    simpleRouteJson,
    inputGraphics,
    topologyGraphics,
    pipelineSolver,
    steps,
    phase: pipelineSolver.getCurrentPhase(),
  }
}

const createPipeline4ReferenceTopologyGraphics = (
  topologyGraphics: GraphicsObject,
): GraphicsObject => {
  return {
    ...topologyGraphics,
    title: "Pipeline4-reference topology",
    rects: dedupeRects((topologyGraphics.rects ?? []).map(normalizeRect)),
    polygons: (topologyGraphics.polygons ?? []).map(normalizePolygon),
    points: topologyGraphics.points ?? [],
    circles: [],
  }
}

const normalizeRect = (rect: Rect): Rect => ({
  ...rect,
  fill: "rgba(0, 0, 0, 0)",
  stroke: getTopologyStroke(rect.layer),
})

const normalizePolygon = (polygon: Polygon): Polygon => ({
  ...polygon,
  fill: "rgba(0, 0, 0, 0)",
  stroke: getTopologyStroke(polygon.layer),
  strokeWidth: 0.006,
})

const getTopologyStroke = (layer: unknown) => {
  if (typeof layer === "string" && layer === "z0") {
    return "rgba(220, 38, 38, 0.1)"
  }
  if (typeof layer === "string" && layer === "z1") {
    return "rgba(37, 99, 235, 0.1)"
  }
  return "rgba(15, 23, 42, 0.06)"
}

const dedupeRects = (rects: Rect[]) => {
  const seen = new Set<string>()
  const deduped: Rect[] = []

  for (const rect of rects) {
    const key = [
      roundForKey(rect.center.x),
      roundForKey(rect.center.y),
      roundForKey(rect.width),
      roundForKey(rect.height),
      rect.layer ?? "",
    ].join(":")

    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(rect)
  }

  return deduped
}

const roundForKey = (value: number) => Math.round(value * 1_000) / 1_000
