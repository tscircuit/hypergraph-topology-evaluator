import { GenericSolverDebugger } from "@tscircuit/solver-utils/react"
import { HypergraphTopologyEvaluatorSolver } from "lib/hypergraph-topology-evaluator-solver"
import {
  simpleHypergraph,
  simpleRouteJson,
} from "tests/fixtures/simple-overlay"

export default function SolverPage() {
  return (
    <GenericSolverDebugger
      createSolver={() =>
        new HypergraphTopologyEvaluatorSolver({
          hypergraph: simpleHypergraph,
          simpleRouteJson,
        })
      }
      animationSpeed={20}
    />
  )
}
