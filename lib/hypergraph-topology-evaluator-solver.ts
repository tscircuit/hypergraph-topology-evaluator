import type { SerializedHyperGraph } from "@tscircuit/hypergraph"
import { BaseSolver } from "@tscircuit/solver-utils"
import type { GraphicsObject } from "graphics-debug"
import type { SimpleRouteJson } from "./simple-route-json"
import { visualizeSimpleRouteJsonOverHypergraph } from "./visualize-simple-route-json-over-hypergraph"

export type HypergraphTopologyEvaluatorInput = {
  hypergraph: SerializedHyperGraph
  simpleRouteJson: SimpleRouteJson
}

export type HypergraphTopologyEvaluatorOutput = {
  flawCount: number
  flaws: Array<{
    type: string
    message: string
  }>
}

export class HypergraphTopologyEvaluatorSolver extends BaseSolver {
  readonly input: HypergraphTopologyEvaluatorInput
  output: HypergraphTopologyEvaluatorOutput = { flawCount: 0, flaws: [] }

  constructor(input: HypergraphTopologyEvaluatorInput) {
    super()
    this.input = input
    this.stats = this.getStats()
  }

  override getSolverName() {
    return "HypergraphTopologyEvaluatorSolver"
  }

  override _step() {
    this.output = { flawCount: 0, flaws: [] }
    this.stats = this.getStats()
    this.progress = 1
    this.solved = true
  }

  override getConstructorParams() {
    return [this.input]
  }

  override getOutput(): HypergraphTopologyEvaluatorOutput {
    return this.output
  }

  override visualize(): GraphicsObject {
    return visualizeSimpleRouteJsonOverHypergraph(this.input)
  }

  override preview(): GraphicsObject {
    return this.visualize()
  }

  private getStats() {
    return {
      regions: this.input.hypergraph.regions.length,
      ports: this.input.hypergraph.ports.length,
      connections: this.input.simpleRouteJson.connections.length,
      traces: this.input.simpleRouteJson.traces?.length ?? 0,
    }
  }
}
