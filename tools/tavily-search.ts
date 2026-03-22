/**
 * @tool
 * description: Search the web with Tavily and return concise, source-backed results.
 */

import { withToolMeta, type ToolMeta } from '../shared/contract.js'

const TAVILY_SEARCH_URL = 'https://api.tavily.com/search'
const DEFAULT_MAX_RESULTS = 5
const MAX_MAX_RESULTS = 10
const REQUEST_TIMEOUT_MS = 15_000
const MAX_TITLE_CHARS = 200
const MAX_ANSWER_CHARS = 1_200
const MAX_SNIPPET_CHARS = 400
const MAX_ERROR_CHARS = 800

type TavilyTopic = 'general' | 'news' | 'finance'

export interface TavilySearchParams {
  query?: string
  maxResults?: string | number
  max_results?: string | number
  topic?: string
}

export interface TavilySearchSource {
  title: string
  url: string
  snippet?: string
  score?: number
  publishedDate?: string
}

export interface TavilySearchResult {
  ok: boolean
  query: string
  topic: TavilyTopic
  results: TavilySearchSource[]
  answer?: string
  responseTime?: number
  requestId?: string
  creditsUsed?: number
  status?: number
  error?: string
}

interface TavilyApiItem {
  title?: unknown
  url?: unknown
  content?: unknown
  score?: unknown
  published_date?: unknown
}

interface TavilyApiResponse {
  query?: unknown
  answer?: unknown
  results?: unknown
  response_time?: unknown
  request_id?: unknown
  usage?: {
    credits?: unknown
  } | null
}

const toolMeta: ToolMeta = {
  runtime: 'orchestrator',
  roles: ['user', 'admin'],
  inputSchema: {
    query: 'search query to run through Tavily',
    topic: 'optional search topic: general, news, or finance',
    maxResults: 'optional integer number of results to return, clamped to 1-10',
  },
}

function getApiKey(): string {
  const apiKey = process.env.TAVILY_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('TAVILY_API_KEY is required for tavily-search')
  }
  return apiKey
}

function truncateText(value: unknown, maxChars: number): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const normalized = value.replace(/\s+/g, ' ').trim()
  if (!normalized) {
    return undefined
  }
  if (normalized.length <= maxChars) {
    return normalized
  }

  return `${normalized.slice(0, Math.max(0, maxChars - 3)).trimEnd()}...`
}

function normalizeTopic(value: unknown): TavilyTopic {
  const normalized = String(value ?? '').trim().toLowerCase()
  if (normalized === 'news' || normalized === 'finance') {
    return normalized
  }
  return 'general'
}

function normalizeMaxResults(value: unknown): number {
  const raw = value ?? DEFAULT_MAX_RESULTS
  const parsed = typeof raw === 'number' ? raw : Number.parseInt(String(raw), 10)
  if (!Number.isFinite(parsed)) {
    return DEFAULT_MAX_RESULTS
  }
  return Math.min(MAX_MAX_RESULTS, Math.max(1, parsed))
}

function normalizeResult(item: TavilyApiItem): TavilySearchSource | null {
  const url = typeof item.url === 'string' ? item.url.trim() : ''
  if (!url) {
    return null
  }

  const title = truncateText(item.title, MAX_TITLE_CHARS) ?? url
  const snippet = truncateText(item.content, MAX_SNIPPET_CHARS)
  const score = typeof item.score === 'number' && Number.isFinite(item.score) ? item.score : undefined
  const publishedDate = typeof item.published_date === 'string' && item.published_date.trim()
    ? item.published_date.trim()
    : undefined

  return {
    title,
    url,
    ...(snippet ? { snippet } : {}),
    ...(score != null ? { score } : {}),
    ...(publishedDate ? { publishedDate } : {}),
  }
}

export async function tavilySearch(params: TavilySearchParams = {}): Promise<TavilySearchResult> {
  const query = params.query?.trim()
  if (!query) {
    throw new Error('query is required')
  }

  const apiKey = getApiKey()
  const topic = normalizeTopic(params.topic)
  const maxResults = normalizeMaxResults(params.maxResults ?? params.max_results)

  try {
    const response = await fetch(TAVILY_SEARCH_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        topic,
        search_depth: 'basic',
        max_results: maxResults,
        include_answer: 'basic',
        include_raw_content: false,
        include_images: false,
        include_favicon: false,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })

    if (!response.ok) {
      const errorText = truncateText(await response.text(), MAX_ERROR_CHARS)
      return {
        ok: false,
        query,
        topic,
        results: [],
        status: response.status,
        error: errorText ?? `tavily search failed with status ${response.status}`,
      }
    }

    const body = await response.json() as TavilyApiResponse
    const results = Array.isArray(body.results)
      ? body.results
        .slice(0, maxResults)
        .map((item) => normalizeResult(item as TavilyApiItem))
        .filter((item): item is TavilySearchSource => item != null)
      : []

    const answer = truncateText(body.answer, MAX_ANSWER_CHARS)
    const responseTimeRaw = typeof body.response_time === 'number'
      ? body.response_time
      : Number.parseFloat(String(body.response_time ?? ''))
    const responseTime = Number.isFinite(responseTimeRaw) ? responseTimeRaw : undefined
    const requestId = typeof body.request_id === 'string' && body.request_id.trim()
      ? body.request_id.trim()
      : undefined
    const creditsUsed = typeof body.usage?.credits === 'number' && Number.isFinite(body.usage.credits)
      ? body.usage.credits
      : undefined

    return {
      ok: true,
      query: typeof body.query === 'string' && body.query.trim() ? body.query.trim() : query,
      topic,
      results,
      ...(answer ? { answer } : {}),
      ...(responseTime != null ? { responseTime } : {}),
      ...(requestId ? { requestId } : {}),
      ...(creditsUsed != null ? { creditsUsed } : {}),
    }
  } catch (error) {
    return {
      ok: false,
      query,
      topic,
      results: [],
      status: 0,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

export default withToolMeta(tavilySearch, toolMeta)
