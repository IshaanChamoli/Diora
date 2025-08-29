import OpenAI from 'openai';

const openai = process.env.OPENROUTER_API_KEY ? new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1"
}) : null;

export interface ProjectAnalysis {
  project_title: string;
  project_description: string;
  questions: string[];
  expert_search_query: string;
}

export async function analyzeTranscript(transcript: string): Promise<ProjectAnalysis> {
  if (!openai) {
    throw new Error("OpenAI client not initialized - OPENROUTER_API_KEY missing");
  }
  const tools = [
    {
      type: "function" as const,
      function: {
        name: "create_project_analysis",
        description: "Create project analysis from call transcript",
        parameters: {
          type: "object",
          properties: {
            project_title: {
              type: "string",
              description: "Specific project title, max 70 characters, plain language"
            },
            project_description: {
              type: "string", 
              description: "4-6 sentences covering objective, time window, geography, stage focus, priorities, and exclusions"
            },
            questions: {
              type: "array",
              items: {
                type: "string"
              },
              description: "Exactly 10 expert-sourcing questions, one sentence each, actionable and alpha-seeking"
            },
            expert_search_query: {
              type: "string",
              description: "Concise expert search query to find relevant domain experts, operators, and practitioners - focus on roles, experience level, and industry context"
            }
          },
          required: ["project_title", "project_description", "questions", "expert_search_query"]
        }
      }
    }
  ];

  const response = await openai.chat.completions.create({
    model: "openai/gpt-5",
    messages: [
      {
        role: "system",
        content: `You are a senior insights editor. You will be given a call transcript. Your job is to produce a crisp, investor-grade brief that can immediately power expert sourcing.

What you must do:
- Infer context from the transcript: objective/why, time window, geographies, stage focus, constraints/exclusions, and priorities
- Create a specific, testable project title (max 70 chars)
- Write 4-6 sentence description covering objective, time window, geography, stage focus, priorities, exclusions
- Generate exactly 10 expert questions that are actionable, alpha-seeking, one sentence each
- Create expert search query to find operators, domain leaders, regulatory/clinical/technical practitioners, buy-side corp dev
- Avoid filler, meta-commentary, or long quotes
- Make sensible domain-aware inferences for missing details

Quality rules for questions:
- One sentence each, plain English, minimal jargon
- Alpha-seeking: surfaces non-obvious signals, tradeoffs, benchmarks, playbooks  
- Avoid duplication; cover breadth of user's aims
- No leading questions or yes/no prompts
- Each question should be answerable by domain experts`
      },
      {
        role: "user", 
        content: `Please analyze this call transcript and create a project analysis:

<TRANSCRIPT>
${transcript}
</TRANSCRIPT>`
      }
    ],
    tools: tools,
    tool_choice: { type: "function", function: { name: "create_project_analysis" } }
  });

  const toolCall = response.choices[0]?.message?.tool_calls?.[0];
  
  if (!toolCall || !('function' in toolCall) || toolCall.function.name !== "create_project_analysis") {
    throw new Error("Failed to get valid analysis from OpenAI");
  }

  const result = JSON.parse(toolCall.function.arguments) as ProjectAnalysis;
  
  // Validate we have exactly 10 questions
  if (result.questions.length !== 10) {
    throw new Error(`Expected exactly 10 questions, got ${result.questions.length}`);
  }

  return result;
}