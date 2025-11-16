import { generateText } from "ai"
import { ollama } from "ollama-ai-provider-v2"
import { z } from "zod"

const INDIVIDUAL_COMMIT_PROMPT = `You are a git commit message generator. Your task is to generate a conventional commit message based on the provided git diff.

CRITICAL REQUIREMENTS:
- Follow the conventional commit format: <type>(<scope>): <description>
- Common types: feat, fix, docs, style, refactor, test, chore, perf, ci, build
- The commit message must be concise and descriptive
- Assign an importance score from 1-10 based on the significance of the change
- Use the generateCommitMessage tool to output the structured commit message

Generate the commit message for the following git diff:

{fileDiff}`

const COMBINE_COMMIT_PROMPT = `You are a git commit message generator. Your task is to generate a single, concise conventional commit message that combines multiple commit messages.

CRITICAL REQUIREMENTS:
- Follow the conventional commit format: <type>(<scope>): <description>
- Common types: feat, fix, docs, style, refactor, test, chore, perf, ci, build
- The message must be strictly less than or equal to 100 characters
- Use the combineCommitMessages tool to output the combined commit message

IMPORTANT GUIDELINES FOR COMBINING:
- Group similar changes together (e.g., multiple docs changes should be combined into one docs message)
- If changes are of different types, prioritize the most significant type or use a general type that encompasses all
- Create a concise description that captures the essence of all changes without listing every detail
- If there are multiple related changes of the same type, combine them with a broader description
- Keep the scope concise - don't list all file names unless necessary
- Focus on what changed semantically, not on every individual file
- When combining: use semicolons to separate different types of changes if needed, but prefer a single unified message
- Example: "refactor: improve commit message generation and update documentation" is better than listing each file

Here are the individual commit messages to combine:

{messages}`

const generateCommitMessageTool = {
  description:
    "Generate a conventional commit message with an importance score based on a git diff. You MUST call this tool to generate the commit message.",
  inputSchema: z.object({
    message: z
      .string()
      .describe(
        "The conventional commit message in format: <type>(<scope>): <description>",
      )
      .max(100),
    importance: z
      .number()
      .int()
      .min(1)
      .max(10)
      .describe("Importance score from 1-10 for the change"),
  }),
  execute: async (args: { message: string; importance: number }) => {
    return { success: true, message: args.message, importance: args.importance }
  },
}

const combineCommitMessagesTool = {
  description:
    "Combine multiple commit messages into a single conventional commit message. You MUST call this tool to generate the combined commit message.",
  inputSchema: z.object({
    message: z
      .string()
      .describe(
        "The combined conventional commit message in format: <type>(<scope>): <description>",
      )
      .max(100),
  }),
  execute: async (args: { message: string }) => {
    return { success: true, message: args.message }
  },
}

export const generateCommitMessage = async (
  fileDiff: string,
): Promise<string> => {
  const { toolCalls, toolResults } = await generateText({
    model: ollama("qwen3"),
    prompt: INDIVIDUAL_COMMIT_PROMPT.replace("{fileDiff}", fileDiff),
    tools: {
      generateCommitMessage: generateCommitMessageTool,
    },
  })

  if (toolResults && toolResults.length > 0) {
    const toolResult = toolResults[0]
    if (toolResult.toolName === "generateCommitMessage") {
      if (toolResult.output) {
        return JSON.stringify(toolResult.output)
      }
    }
  }

  const errorMsg = `Failed to generate commit message using tool. toolCalls: ${toolCalls?.length || 0}, toolResults: ${toolResults?.length || 0}`
  throw new Error(errorMsg)
}

export const combineCommitMessages = async (
  messages: string[],
): Promise<string> => {
  const messagesList = messages.map((msg, i) => `${i + 1}. ${msg}`).join("\n")
  const { toolCalls, toolResults } = await generateText({
    model: ollama("qwen3"),
    prompt: COMBINE_COMMIT_PROMPT.replace("{messages}", messagesList),
    tools: {
      combineCommitMessages: combineCommitMessagesTool,
    },
  })

  if (toolResults && toolResults.length > 0) {
    const toolResult = toolResults[0]
    if (toolResult.toolName === "combineCommitMessages") {
      if (toolResult.output) {
        const result = toolResult.output as { message: string }
        return result.message.trim()
      }
    }
  }

  const errorMsg = `Failed to combine commit messages using tool. toolCalls: ${toolCalls?.length || 0}, toolResults: ${toolResults?.length || 0}`
  throw new Error(errorMsg)
}
