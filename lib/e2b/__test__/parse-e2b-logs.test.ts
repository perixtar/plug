import { parseAndGetLogsSince } from '..'
import { describe, expect, it } from 'vitest'

describe('Parse E2B Logs', () => {
  it('Parse the raw logs from e2b', async () => {
    const rawLog = `
=== 2025-08-01T21:52:31+00:00 ===
 ⨯ ./app/page.tsx:3:1
Module not found: Can't resolve '../components/FeedCard'
  1 | import {  } from 'react';
  2 | import { getFeeds } from '../lib/feedsService';
> 3 | import { FeedCard } from '../components/FeedCard';
    | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  4 | import { LoadingSkeleton } from '../components/LoadingSkeleton';
  5 |
  6 | async function FeedsList() {}

=== 2025-08-02T21:52:31+00:00 ===
 ⨯ ./app/page.tsx:3:1
Module not found: Can't resolve '../components/FeedCard'
  // … etc …
`

    const timestamp1 = new Date('2025-08-02T21:52:30+00:00')
    const newerLogs = await parseAndGetLogsSince(rawLog, timestamp1)
    expect(newerLogs.length).toBe(1)

    const timestamp2 = new Date('2025-08-01T21:52:30+00:00')
    const filteredLogs = await parseAndGetLogsSince(rawLog, timestamp2)
    expect(filteredLogs.length).toBe(2)
  })
})
