"use client";

import { useCallback, useState } from "react";
import ReactFlow, {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from "reactflow";
import "reactflow/dist/style.css";

// 1. THIS STOPS THE INFINITE RELOAD LOOP
const nodeTypes = {};

const initialNodes: Node[] = [
  {
    id: "1",
    position: { x: 250, y: 100 },
    data: { label: "Is this a support request?" },
  },
];

export default function Home() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setNodes((currentNodes) => applyNodeChanges(changes, currentNodes)),
    [],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((currentEdges) => applyEdgeChanges(changes, currentEdges)),
    [],
  );

  const onConnect = useCallback((connection: Connection) => {
    const label = prompt("Is this a YES or NO path?", "YES")?.toUpperCase() || "NO";
    setEdges((currentEdges) =>
      addEdge({ ...connection, label }, currentEdges),
    );
  }, []);

  const addNode = () => {
    const id = (nodes.length + 1).toString();
    setNodes((currentNodes) => [
      ...currentNodes,
      {
        id,
        position: { x: Math.random() * 400, y: Math.random() * 400 },
        data: { label: "New Decision?" },
      },
    ]);
  };

  const runWorkflow = async () => {
    if (nodes.length === 0) {
      setLogs(["Add a decision node before running the workflow."]);
      return;
    }

    setLogs(["Sending workflow to Inngest..."]);

    try {
      const response = await fetch("/api/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startNodeId: nodes[0].id,
          graph: { nodes, edges },
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
      }

      const result: { message?: string } = await response.json();
      setLogs([result.message ?? "Workflow event sent to Inngest. Check the Inngest Dashboard!"]);
    } catch (error) {
      setLogs([
        error instanceof Error ? error.message : "Unable to start the workflow.",
      ]);
    }
  };

  return (
    <main className="flex h-screen w-screen overflow-hidden">
      <section className="relative min-w-0 flex-1 border-r">
        <div className="absolute z-10 flex w-full gap-2 bg-white p-4 shadow-sm">
          <button
            onClick={addNode}
            className="rounded bg-blue-600 px-4 py-2 text-white"
          >
            Add Node
          </button>
          <button
            onClick={runWorkflow}
            className="rounded bg-green-600 px-4 py-2 text-white"
          >
            Run Workflow
          </button>
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes} // 2. ADDED HERE
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDoubleClick={(_, node) => {
            const label = prompt("Edit prompt:", node.data.label);
            if (label) {
              setNodes((currentNodes) =>
                currentNodes.map((currentNode) =>
                  currentNode.id === node.id
                    ? { ...currentNode, data: { ...currentNode.data, label } }
                    : currentNode,
                ),
              );
            }
          }}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </section>

      <aside className="w-80 shrink-0 overflow-y-auto bg-gray-900 p-4 font-mono text-sm text-green-400">
        <h2 className="mb-4 font-bold text-white">Execution Logs</h2>
        {logs.length === 0 ? (
          <p className="text-gray-400">Workflow output will appear here.</p>
        ) : (
          <div className="space-y-2" aria-live="polite">
            {logs.map((log, index) => (
              <p key={`${index}-${log}`}>{log}</p>
            ))}
          </div>
        )}
      </aside>
    </main>
  );
}