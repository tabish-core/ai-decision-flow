import { Inngest } from "inngest";
export const inngest = new Inngest({
  id: "ai-flow-app",
  isDev: process.env.NODE_ENV !== "production",
});
