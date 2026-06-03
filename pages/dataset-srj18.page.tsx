import datasetDefault, { dataset as namedDataset } from "dataset-srj18"
import { InteractiveGraphicsCanvas } from "graphics-debug/react"
import { generatePipeline7Topology } from "lib/generate-pipeline7-topology"
import { HypergraphTopologyEvaluatorSolver } from "lib/hypergraph-topology-evaluator-solver"
import type { SimpleRouteJson } from "lib/simple-route-json"
import { useMemo, useState } from "react"

const datasetRecord = (namedDataset ??
  (datasetDefault as any).default ??
  (datasetDefault as any).dataset ??
  datasetDefault) as Record<string, SimpleRouteJson>

const sampleEntries = Object.entries(datasetRecord).sort(([a], [b]) =>
  a.localeCompare(b),
)

export default function DatasetSrj18Page() {
  const [selectedSampleName, setSelectedSampleName] = useState(
    sampleEntries[0]?.[0] ?? "",
  )
  const [status, setStatus] = useState("select a sample")
  const [isGenerating, setIsGenerating] = useState(false)
  const [overlaySolver, setOverlaySolver] =
    useState<HypergraphTopologyEvaluatorSolver | null>(null)

  const selectedSample = datasetRecord[selectedSampleName]
  const sampleSummary = useMemo(() => {
    if (!selectedSample) return null
    return {
      sourceName: selectedSample.sourceName ?? selectedSampleName,
      obstacles: selectedSample.obstacles.length,
      connections: selectedSample.connections.length,
      layerCount: selectedSample.layerCount,
    }
  }, [selectedSample, selectedSampleName])

  const generateTopology = async () => {
    if (!selectedSample) return

    setIsGenerating(true)
    setOverlaySolver(null)
    setStatus("generating topology")

    try {
      const result = await generatePipeline7Topology(selectedSample, {
        onProgress: ({ steps, phase, activeSolverName }) => {
          setStatus(
            `steps=${steps} phase=${phase}${activeSolverName ? ` active=${activeSolverName}` : ""}`,
          )
        },
      })
      const solver = new HypergraphTopologyEvaluatorSolver({
        hypergraph: result.hypergraph,
        simpleRouteJson: result.simpleRouteJson,
        inputGraphics: result.inputGraphics,
        topologyGraphics: result.topologyGraphics,
      })
      solver.solve()
      setOverlaySolver(solver)
      setStatus(
        `generated topology: regions=${result.hypergraph.regions.length} ports=${result.hypergraph.ports.length} connections=${result.hypergraph.connections?.length ?? 0} steps=${result.steps}`,
      )
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error))
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <main>
      <label>
        sample{" "}
        <select
          value={selectedSampleName}
          onChange={(event) => {
            setSelectedSampleName(event.target.value)
            setOverlaySolver(null)
            setStatus("select a sample")
          }}
          disabled={isGenerating}
        >
          {sampleEntries.map(([sampleName, sample]) => (
            <option key={sampleName} value={sampleName}>
              {sampleName} {sample.sourceName ? `- ${sample.sourceName}` : ""}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        onClick={generateTopology}
        disabled={!selectedSample || isGenerating}
      >
        generate topology
      </button>
      <p>{status}</p>
      {sampleSummary ? (
        <p>
          {sampleSummary.sourceName} | layers={sampleSummary.layerCount} |
          obstacles={sampleSummary.obstacles} | connections=
          {sampleSummary.connections}
        </p>
      ) : null}
      {overlaySolver ? (
        <InteractiveGraphicsCanvas
          graphics={overlaySolver.visualize()}
          height={720}
          showGrid
          showLabelsByDefault={false}
        />
      ) : null}
    </main>
  )
}
