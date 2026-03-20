import { beforeEach, describe, expect, it, vi } from 'vitest'

import fetchUrl from './fetch-url.js'

describe('fetch-url', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    vi.resetAllMocks()
    vi.stubGlobal('fetch', mockFetch)
  })

  it('returns raw response metadata and body text', async () => {
    mockFetch.mockResolvedValue(new Response('hello world', {
      status: 200,
      headers: {
        'content-type': 'text/plain',
      },
    }))

    const result = await fetchUrl({ url: 'https://example.com/llms.txt' })

    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/llms.txt',
      expect.objectContaining({
        headers: expect.objectContaining({
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
        }),
      }),
    )
    expect(result).toEqual({
      ok: true,
      url: 'https://example.com/llms.txt',
      finalUrl: 'https://example.com/llms.txt',
      status: 200,
      contentType: 'text/plain',
      body: 'hello world',
    })
  })

  it('returns non-2xx responses without summarizing the body', async () => {
    mockFetch.mockResolvedValue(new Response('not found body', {
      status: 404,
      headers: {
        'content-type': 'text/plain',
      },
    }))

    const result = await fetchUrl({ url: 'https://example.com/missing' })

    expect(result).toEqual({
      ok: false,
      url: 'https://example.com/missing',
      finalUrl: 'https://example.com/missing',
      status: 404,
      contentType: 'text/plain',
      body: 'not found body',
    })
  })

  it('returns structured network failures', async () => {
    mockFetch.mockRejectedValue(new Error('boom'))

    const result = await fetchUrl({ url: 'https://example.com/down' })

    expect(result).toEqual({
      ok: false,
      url: 'https://example.com/down',
      status: 0,
      contentType: null,
      error: 'boom',
    })
  })
})
