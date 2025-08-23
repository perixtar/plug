import { StdLogEntry } from '@/types/std-log-entry'

/**
 * Parse the raw log text into an array of { timestamp, content }.
 * Each time we see a line starting with "=== … ===" we start a new group,
 * and we accumulate all subsequent lines until the next marker.
 */
function parseLogGroups(raw: string): StdLogEntry[] {
  const headerRe =
    /^===\s*(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+\-]\d{2}:\d{2}))\s*===/
  const lines = raw.split(/\r?\n/)
  const groups: StdLogEntry[] = []

  let currentTs: Date | null = null
  let buffer: string[] = []

  for (const line of lines) {
    const m = headerRe.exec(line)
    if (m) {
      // flush previous group
      if (currentTs) {
        groups.push({
          timestamp: currentTs,
          content: buffer.join('\n').trimEnd(),
        })
      }
      // start new group
      currentTs = new Date(m[1])
      buffer = []
    } else if (currentTs) {
      // still inside a group → collect the line
      // Remove ANSI escape codes from the line
      buffer.push(line.replace(/\x1B\[[0-9;]*[A-Za-z]/g, ''))
    }
  }

  // flush the last group if any
  if (currentTs) {
    groups.push({
      timestamp: currentTs,
      content: buffer.join('\n').trimEnd(),
    })
  }

  return groups
}

/**
 * Given the raw log text and a threshold Date, return only the groups
 * whose timestamp is strictly after that threshold.
 */
export function parseAndGetLogsSince(
  raw: string,
  threshold: Date,
): StdLogEntry[] {
  const all = parseLogGroups(raw.trim())
  return all.filter((g) => {
    return g.timestamp > threshold
  })
}
