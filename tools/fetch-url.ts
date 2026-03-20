/**
 * @tool
 * description: Fetch a URL and return the raw response body plus response metadata.
 */

import { withToolMeta, type ToolMeta } from '../shared/contract.js'

interface FetchUrlParams {
  url?: string
}

interface FetchUrlResult {
  ok: boolean
  url: string
  finalUrl?: string
  status: number
  contentType: string | null
  body?: string
  error?: string
}

const toolMeta: ToolMeta = {
  runtime: 'orchestrator',
  roles: ['user', 'admin'],
  inputSchema: {
    url: 'absolute URL to fetch, such as an app /llms.txt endpoint',
  },
}

const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36'

async function fetchUrl(params: FetchUrlParams = {}): Promise<FetchUrlResult> {
  const url = params.url?.trim()
  if (!url) {
    throw new Error('url is required')
  }

  try {
    const response = await fetch(url, {
      headers: {
        'user-agent': DEFAULT_USER_AGENT,
      },
      signal: AbortSignal.timeout(15_000),
    })
    const body = await response.text()

    return {
      ok: response.ok,
      url,
      finalUrl: response.url || url,
      status: response.status,
      contentType: response.headers.get('content-type'),
      body,
    }
  } catch (error) {
    return {
      ok: false,
      url,
      status: 0,
      contentType: null,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

export default withToolMeta(fetchUrl, toolMeta)
export { fetchUrl }
