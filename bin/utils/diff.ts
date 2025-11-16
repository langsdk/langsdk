export const splitDiffByFile = (diff: string): string[] => {
  if (!diff.trim()) {
    return []
  }

  const parts = diff.split(/(?=^diff --git)/m)

  const fileDiffs = parts.filter((part) => part.trim().length > 0)

  if (fileDiffs.length === 0) {
    return [diff]
  }

  return fileDiffs
}
