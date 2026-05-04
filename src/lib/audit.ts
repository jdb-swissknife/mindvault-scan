import { type SEORequest, type SEOResult } from '../types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export async function runSEO(request: SEORequest): Promise<SEOResult> {
  let domain = request.domain
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/^www\./, '')
    .toLowerCase()

  const response = await fetch(`${SUPABASE_URL}/functions/v1/seo-audit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      domain,
      trade: request.trade,
      city: request.city,
      state: request.state,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(err || 'SEO audit failed')
  }

  return response.json()
}

export function scoreColor(score: number): string {
  if (score >= 70) return '#22C55E'
  if (score >= 40) return '#c2703e'
  return '#78716c'
}

export function scoreLabel(score: number): string {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Needs Work'
  if (score >= 20) return 'Poor'
  return 'Critical'
}

export function scoreSummary(score: number, trade: string, city: string): string {
  if (score >= 70) {
    return `Your site has strong SEO fundamentals. A few optimizations could push you to page 1.`
  }
  if (score >= 40) {
    return `Your site has some SEO basics covered but is missing key signals Google uses to rank ${trade} businesses in ${city}.`
  }
  return `Your site has major SEO gaps. When someone searches "${trade} ${city}", you're not showing up.`
}

export const SCAN_STEPS = [
  { id: 'index', label: 'Checking Google Index & Coverage', icon: 'search' },
  { id: 'meta', label: 'Analyzing Meta Tags & Headings', icon: 'code' },
  { id: 'speed', label: 'Testing Page Speed & Mobile', icon: 'zap' },
  { id: 'keywords', label: 'Checking Keyword Rankings', icon: 'target' },
  { id: 'local', label: 'Scanning Local SEO Signals', icon: 'map-pin' },
  { id: 'backlinks', label: 'Analyzing Backlink Profile', icon: 'link' },
  { id: 'report', label: 'Generating SEO Report', icon: 'file-bar-chart' },
] as const
