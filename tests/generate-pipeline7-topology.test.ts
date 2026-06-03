import { expect, test } from "bun:test"
import { dataset } from "dataset-srj18"
import { generatePipeline7Topology } from "lib/generate-pipeline7-topology"
import { HypergraphTopologyEvaluatorSolver } from "lib/hypergraph-topology-evaluator-solver"

test("generates a Pipeline7 topology from dataset-srj18 sample001", async () => {
  const sample = dataset.sample001
  expect(sample).toBeDefined()

  const result = await generatePipeline7Topology(sample!, {
    maxSteps: 50_000,
    yieldEverySteps: 10_000,
  })

  expect(result.phase).toBe("portPointPathingSolver")
  expect(result.hypergraph.regions.length).toBeGreaterThan(0)
  expect(result.hypergraph.ports.length).toBeGreaterThan(0)
  expect(result.hypergraph.connections?.length).toBeGreaterThan(0)
  expect(result.inputGraphics.points?.length).toBeGreaterThan(0)
  expect(result.topologyGraphics.rects?.length).toBeGreaterThan(0)
  expect(result.topologyGraphics.circles?.length ?? 0).toBe(0)
  expect(result.topologyGraphics.title).toBe("Pipeline4-reference topology")

  const solver = new HypergraphTopologyEvaluatorSolver({
    hypergraph: result.hypergraph,
    simpleRouteJson: result.simpleRouteJson,
    inputGraphics: result.inputGraphics,
    topologyGraphics: result.topologyGraphics,
  })
  expect(solver.visualize().title).toBe(
    "Pipeline7 SimpleRouteJson + TinyHyperGraph topology",
  )
  expect(solver.visualize().rects?.length).toBeGreaterThan(
    result.topologyGraphics.rects?.length ?? 0,
  )
})
