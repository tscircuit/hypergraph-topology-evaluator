import { expect, test } from "bun:test"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { HypergraphTopologyEvaluatorSolver } from "lib/hypergraph-topology-evaluator-solver"
import { visualizeSimpleRouteJsonOverHypergraph } from "lib/visualize-simple-route-json-over-hypergraph"
import {
  simpleHypergraph,
  simpleRouteJson,
} from "tests/fixtures/simple-overlay"

test("visualizes SimpleRouteJson over a SerializedHyperGraph", () => {
  const graphics = visualizeSimpleRouteJsonOverHypergraph({
    hypergraph: simpleHypergraph,
    simpleRouteJson,
  })

  expect(graphics.coordinateSystem).toBe("cartesian")
  expect(graphics.title).toBe("SimpleRouteJson over SerializedHyperGraph")
  expect(graphics.rects?.length).toBeGreaterThanOrEqual(4)
  expect(graphics.lines?.length).toBeGreaterThanOrEqual(3)
  expect(graphics.points?.length).toBeGreaterThanOrEqual(4)
  expect(graphics.circles?.length ?? 0).toBe(0)

  const svg = getSvgFromGraphicsObject(graphics)
  expect(svg).toContain("svg")
  expect(svg).toContain("regions=3 ports=2")
})

test("solver exposes the overlay through visualize", () => {
  const solver = new HypergraphTopologyEvaluatorSolver({
    hypergraph: simpleHypergraph,
    simpleRouteJson,
  })

  solver.solve()

  expect(solver.solved).toBe(true)
  expect(solver.getOutput()).toEqual({ flawCount: 0, flaws: [] })
  expect(solver.visualize().title).toBe(
    "SimpleRouteJson over SerializedHyperGraph",
  )
})
