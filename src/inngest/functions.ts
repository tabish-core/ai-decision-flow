import { inngest } from "./client";
import OpenAI from "openai";

console.log("KEY EXISTS:", !!process.env.OPENAI_API_KEY);

type WorkflowNode = {
  id: string;
  data: { label?: string };
};

type WorkflowEdge = {
  source: string;
  target: string;
  label?: string;
};

type WorkflowGraph = {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "sk-dummy",
  baseURL: "https://openrouter.ai/api/v1",
});

export const executeWorkflow = inngest.createFunction(
  {
    id: "execute-workflow",
    triggers: [{ event: "app/workflow.execute" }],
  },
  async ({ event, step }) => {
    const { startNodeId, graph } = event.data as {
      startNodeId: string;
      graph: WorkflowGraph;
    };
    let currentNodeId: string | null = startNodeId;
    const logs = [];

    while (currentNodeId && currentNodeId !== "end") {
      const node = graph.nodes.find(
        (candidate) => candidate.id === currentNodeId,
      );
      if (!node) break;

      const aiResponse: string = await step.run(
        `run-ai-${currentNodeId}`,
        async () => {
          try {
            const res = await openai.chat.completions.create({
              model: "openrouter/free",
              messages: [
                {
                  role: "system",
                  content:
                    "You are a decision engine. Respond with ONLY the word YES or NO.",
                },
                {
                  role: "user",
                  content: node.data.label || "Is this a support request?",
                },
              ],
              temperature: 0,
            });
            return res.choices[0].message.content?.trim().toUpperCase() || "NO";
          } catch (error) {
            console.error("🔥 AI ERROR:", error);
            throw error;
          }
        },
      );

      logs.push(`Node [${node.data.label}]: ${aiResponse}`);

      const nextEdge: WorkflowEdge | undefined = graph.edges.find(
        (edge) => edge.source === currentNodeId && edge.label === aiResponse,
      );
      currentNodeId = nextEdge ? nextEdge.target : null;
    }
    return { logs };
  },
);
