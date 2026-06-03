# hypergraph-topology-evaluator

`hypergraph-topology-evaluator` is a solver-style TypeScript package for inspecting and eventually scoring topology generated for PCB autorouting.

The intended input is:

- a `SerializedHyperGraph` from `@tscircuit/hypergraph`
- a `SimpleRouteJson` from the autorouting pipeline

The actual topology-quality solver is still a stub. It currently accepts those inputs, reports zero flaws, and focuses on visualization so the generated topology can be inspected against the original routing problem.

## Setup

```sh
bun install
```

## Common Commands

```sh
bun run start
bun test
bun run typecheck
bun run format
bun run build:site
```

`bun run start` runs React Cosmos. The dataset page is available in Cosmos as `pages/dataset-srj18.page.tsx`.

## Main Pieces

### `HypergraphTopologyEvaluatorSolver`

Source: `lib/hypergraph-topology-evaluator-solver.ts`

This is the main solver exported by the package. It extends `BaseSolver` from `@tscircuit/solver-utils`.

Constructor input:

```ts
{
  hypergraph: SerializedHyperGraph
  simpleRouteJson: SimpleRouteJson
  inputGraphics?: GraphicsObject
  topologyGraphics?: GraphicsObject
}
```

Current behavior:

- `_step()` immediately marks the solver solved.
- `getOutput()` returns `{ flawCount: 0, flaws: [] }`.
- `visualize()` overlays the routing problem and topology graphics.

The future evaluator should replace the stubbed `_step()` behavior with real topology-quality analysis.

### `generatePipeline7Topology`

Source: `lib/generate-pipeline7-topology.ts`

This helper turns a `SimpleRouteJson` sample into the data needed by the evaluator.

It does the following:

1. Creates `AutoroutingPipelineSolver7_MultiGraph` from `@tscircuit/capacity-autorouter`.
2. Repeatedly calls `.step()` until Pipeline7 reaches `portPointPathingSolver`.
3. Reads the port point pathing solver constructor params with `getConstructorParams()`.
4. Converts the resulting hypergraph and connections into a `SerializedHyperGraph`.
5. Captures graphics used by `visualize()`.

The returned object includes:

```ts
{
  hypergraph,
  simpleRouteJson,
  inputGraphics,
  topologyGraphics,
  pipelineSolver,
  steps,
  phase,
}
```

`inputGraphics` is captured from Pipeline4's initial `visualize()` output because that is the current visual reference for rendering the SRJ/problem view.

`topologyGraphics` is captured from Pipeline7's tiny-hypergraph port point pathing solver, then normalized for readability:

- topology circles are removed
- topology region rects are outline-only
- duplicate rects are removed
- low-alpha strokes are used so the SRJ/problem layer remains visible

### `visualizeSimpleRouteJsonOverHypergraph`

Source: `lib/visualize-simple-route-json-over-hypergraph.ts`

This combines the visualization layers into one `graphics-debug` `GraphicsObject`.

When `inputGraphics` and `topologyGraphics` are provided, it draws:

1. topology graphics underneath
2. Pipeline4-style SRJ/problem graphics on top

The combined view intentionally emits `circles: []`. Circles from upstream visualizers are converted to points or removed because large-radius circles can obscure the topology and traces in `graphics-debug`.

If no precomputed graphics are supplied, the function falls back to a lightweight local visualization of the `SerializedHyperGraph` plus `SimpleRouteJson`.

## Cosmos Pages

### `pages/dataset-srj18.page.tsx`

This page loads samples from `dataset-srj18`.

The UI is intentionally minimal:

- select a dataset sample
- click `generate topology`
- wait while Pipeline7 steps to `portPointPathingSolver`
- inspect the combined `graphics-debug` canvas

The generated solver is created with:

```ts
new HypergraphTopologyEvaluatorSolver({
  hypergraph: result.hypergraph,
  simpleRouteJson: result.simpleRouteJson,
  inputGraphics: result.inputGraphics,
  topologyGraphics: result.topologyGraphics,
})
```

### `pages/solver.page.tsx`

This is a small `GenericSolverDebugger` fixture using the local test fixture in `tests/fixtures/simple-overlay.ts`.

It is useful for checking that the solver lifecycle and fallback visualization work without running Pipeline7.

## Tests

The test suite covers:

- fallback SRJ-over-hypergraph visualization
- solver lifecycle and output shape
- generating a Pipeline7 topology from `dataset-srj18` sample001
- ensuring generated topology graphics do not contain circles

Run:

```sh
bun test
```

## Current Limitations

- The evaluator does not analyze topology quality yet.
- Pipeline7 generation runs in the browser thread on the Cosmos page, so large samples can take noticeable time.
- The visualization is optimized for inspection, not exact reproduction of every upstream debug primitive.
- `topologyGraphics` is currently normalized to make the overlay readable; this means some tiny-hypergraph debug markers are intentionally omitted.
