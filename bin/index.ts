#!/usr/bin/env node
import { combineCommitMessages, generateCommitMessage } from "@/utils/ai"
import { getVersion, helpMessage, parse } from "@/utils/args"
import { splitDiffByFile } from "@/utils/diff"
import { getGitDiff } from "@/utils/git"

const main = async () => {
  try {
    const { values } = parse({
      allowPositionals: false,
      options: {
        help: { type: "boolean", short: "h" },
        version: { type: "boolean", short: "v" },
      },
    })

    if (values.version) {
      console.log(getVersion())
      process.exit(0)
    }

    if (values.help) {
      console.log(helpMessage)
      process.exit(0)
    }

    const diff = await getGitDiff()

    if (!diff.trim()) {
      console.log("No staged or unstaged changes detected.")
      process.exit(0)
    }

    const fileDiffs = splitDiffByFile(diff)

    const commitMessages: string[] = []

    for (const fileDiff of fileDiffs) {
      const message = await generateCommitMessage(fileDiff)
      commitMessages.push(message)
    }

    if (!commitMessages.length) {
      console.log("No changes detected.")
      process.exit(0)
    }

    const combinedMessage = await combineCommitMessages(commitMessages)
    console.log(combinedMessage)

    process.exit(0)
  } catch (err: any) {
    console.error(helpMessage)
    console.error(`\n${err.message}\n`)
    process.exit(1)
  }
}

main()
