import { readFile } from "node:fs/promises"
import spawn from "nano-spawn"

const getDiffCommand = (staged: boolean) => [
  "--no-pager",
  "diff",
  ...(staged ? ["--cached"] : []),
  "-U1000",
  "--",
  ".",
  ":(exclude)bun.lock",
  ":(exclude)package-lock.json",
  ":(exclude)yarn.lock",
  ":(exclude)pnpm-lock.yaml",
]

const LOCK_FILE_PATTERNS = [
  "bun.lock",
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
]

const isLockFile = (filePath: string): boolean => {
  return LOCK_FILE_PATTERNS.some((pattern) => filePath.includes(pattern))
}

export const getStagedDiff = async (): Promise<string> => {
  try {
    const result = await spawn("git", getDiffCommand(true))
    return result.stdout
  } catch {
    return ""
  }
}

export const getUnstagedDiff = async (): Promise<string> => {
  try {
    const result = await spawn("git", getDiffCommand(false))
    return result.stdout
  } catch {
    return ""
  }
}

export const getUntrackedFilesDiff = async (): Promise<string> => {
  try {
    const result = await spawn("git", [
      "ls-files",
      "--others",
      "--exclude-standard",
    ])
    const untrackedFiles = result.stdout
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !isLockFile(line))

    if (untrackedFiles.length === 0) {
      return ""
    }

    const diffs: string[] = []
    for (const file of untrackedFiles) {
      try {
        const content = await readFile(file, "utf-8")
        const lines = content.split("\n")
        diffs.push(
          `diff --git a/${file} b/${file}\n` +
            `new file mode 100644\n` +
            `index 0000000..1111111\n` +
            `--- /dev/null\n` +
            `+++ b/${file}\n` +
            lines.map((line) => `+${line}`).join("\n"),
        )
      } catch {
        continue
      }
    }

    return diffs.join("\n")
  } catch {
    return ""
  }
}

export const getGitDiff = async (): Promise<string> => {
  const stagedDiff = await getStagedDiff()
  const unstagedDiff = await getUnstagedDiff()
  const untrackedDiff = await getUntrackedFilesDiff()

  const diffs: string[] = []
  if (stagedDiff.trim()) {
    diffs.push(stagedDiff)
  } else if (unstagedDiff.trim()) {
    diffs.push(unstagedDiff)
  }
  if (untrackedDiff.trim()) {
    diffs.push(untrackedDiff)
  }

  return diffs.join("\n")
}
