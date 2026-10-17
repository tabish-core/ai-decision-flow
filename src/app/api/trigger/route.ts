import { NextResponse } from "next/server";
import { inngest } from "@/inngest/client";

export async function POST(req: Request) {
  const body = await req.json();
  
  await inngest.send({
    name: "app/workflow.execute",
    data: {
      startNodeId: body.startNodeId,
      graph: body.graph,
    }
  });

  return NextResponse.json({ 
    message: "Event sent to Inngest! Check localhost:8288." 
  });
}