import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

import tavilySearch from './tavily-search.js'

describe('tavily-search', () => {
  const mockFetch = vi.fn()
  const originalApiKey = process.env.TAVILY_API_KEY

  beforeEach(() => {
    vi.resetAllMocks()
    vi.stubGlobal('fetch', mockFetch)
    process.env.TAVILY_API_KEY = 'tvly-test'
  })

  afterAll(() => {
    if (originalApiKey == null) {
      delete process.env.TAVILY_API_KEY
    } else {
      process.env.TAVILY_API_KEY = originalApiKey
    }
  })

  it('calls Tavily with bounded defaults and returns compact source-backed results', async () => {
    mockFetch.mockResolvedValue(new Response(JSON.stringify({
      query: 'latest ethereum etf news',
      answer: ` ${'A'.repeat(1300)} `,
      response_time: 1.23,
      request_id: 'req-1',
      usage: { credits: 1 },
      results: [
        {
          title: 'Ethereum ETF filing update',
          url: 'https://example.com/eth-etf',
          content: `${'snippet '.repeat(80)}`,
          score: 0.93,
          published_date: '2026-03-22',
        },
        {
          title: 'Second source',
          url: 'https://example.com/second',
          content: 'short snippet',
        },
      ],
    }), {
      status: 200,
      headers: {
        'content-type': 'application/json',
      },
    }))

    const result = await tavilySearch({
      query: 'latest ethereum etf news',
      topic: 'news',
      maxResults: '50',
    })

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.tavily.com/search',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer tvly-test',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
          query: 'latest ethereum etf news',
          topic: 'news',
          search_depth: 'basic',
          max_results: 10,
          include_answer: 'basic',
          include_raw_content: false,
          include_images: false,
          include_favicon: false,
        }),
      }),
    )
    expect(result.ok).toBe(true)
    expect(result.topic).toBe('news')
    expect(result.creditsUsed).toBe(1)
    expect(result.requestId).toBe('req-1')
    expect(result.answer?.length).toBeLessThanOrEqual(1200)
    expect(result.results).toEqual([
      {
        title: 'Ethereum ETF filing update',
        url: 'https://example.com/eth-etf',
        snippet: expect.stringMatching(/\.\.\.$/),
        score: 0.93,
        publishedDate: '2026-03-22',
      },
      {
        title: 'Second source',
        url: 'https://example.com/second',
        snippet: 'short snippet',
      },
    ])
  })

  it('throws when the Tavily API key is missing', async () => {
    delete process.env.TAVILY_API_KEY

    await expect(tavilySearch({
      query: 'eth price',
    })).rejects.toThrow('TAVILY_API_KEY is required for tavily-search')

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('returns structured upstream failures', async () => {
    mockFetch.mockResolvedValue(new Response('rate limited by upstream provider', {
      status: 429,
      headers: {
        'content-type': 'text/plain',
      },
    }))

    const result = await tavilySearch({
      query: 'breaking crypto news',
      topic: 'news',
    })

    expect(result).toEqual({
      ok: false,
      query: 'breaking crypto news',
      topic: 'news',
      results: [],
      status: 429,
      error: 'rate limited by upstream provider',
    })
  })

  it('returns structured network failures and keeps empty result sets compact', async () => {
    mockFetch.mockRejectedValue(new Error('socket hang up'))

    const failure = await tavilySearch({
      query: 'solana validator news',
      topic: 'news',
    })

    expect(failure).toEqual({
      ok: false,
      query: 'solana validator news',
      topic: 'news',
      results: [],
      status: 0,
      error: 'socket hang up',
    })

    mockFetch.mockResolvedValue(new Response(JSON.stringify({
      query: 'obscure query',
      results: [],
    }), {
      status: 200,
      headers: {
        'content-type': 'application/json',
      },
    }))

    const empty = await tavilySearch({
      query: 'obscure query',
    })

    expect(empty).toEqual({
      ok: true,
      query: 'obscure query',
      topic: 'general',
      results: [],
    })
  })
})
