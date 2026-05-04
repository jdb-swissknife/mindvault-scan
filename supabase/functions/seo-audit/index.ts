// MindVault Scan - SEO Audit Edge Function
// Traditional SEO checks: index, meta, speed, keywords, local, backlinks

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const SERPER_API_KEY=Deno.env.get('SERPER_API_KEY')!

interface SEORequest {
  domain: string
  trade: string
  city: string
  state: string
}

interface Check {
  id: string
  label: string
  status: 'pass' | 'warn' | 'fail'
  detail: string
  impact_note: string
  solution_hint: string
}

interface Action {
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM'
  action: string
}

async function serperSearch(query: string): Promise<any[]> {
  try {
    const resp = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query, num: 10 }),
    })
    if (!resp.ok) return []
    const data = await resp.json()
    return data.organic || []
  } catch {
    return []
  }
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MindVaultScan/1.0)' },
      signal: AbortSignal.timeout(10000),
    })
    return resp.ok ? await resp.text() : null
  } catch {
    return null
  }
}

// A: Index & Coverage
async function checkIndex(domain: string): Promise<Check[]> {
  const checks: Check[] = []

  const serp = await serperSearch(`site:${domain}`)
  const count = serp.length
  checks.push({
    id: 'A1',
    label: 'Google index coverage',
    status: count > 5 ? 'pass' : count > 0 ? 'warn' : 'fail',
    detail: count > 5
      ? `${count} pages indexed. Good coverage.`
      : count > 0
        ? `Only ${count} pages found. Most businesses need 10+ pages to rank well.`
        : 'No pages found in Google index. Your site may not be indexed at all.',
    impact_note: count > 5 ? '' : "If Google hasn't indexed your pages, you simply don't exist in search results. No index means no traffic, no leads.",
    solution_hint: count > 5 ? '' : 'This requires technical fixes to ensure Google can discover and crawl every important page on your site.',
  })

  const sitemap = await fetchPage(`https://${domain}/sitemap.xml`)
  checks.push({
    id: 'A2',
    label: 'Sitemap.xml present',
    status: sitemap ? 'pass' : 'fail',
    detail: sitemap
      ? 'Sitemap found. Google uses this to discover and crawl your pages.'
      : 'No sitemap found. Add /sitemap.xml to help Google crawl your site.',
    impact_note: sitemap ? '' : 'Without a sitemap, Google has to guess where your pages are. Important pages may never get found.',
    solution_hint: sitemap ? '' : 'We generate and maintain a proper sitemap that guides Google to every page you want ranked.',
  })

  const robots = await fetchPage(`https://${domain}/robots.txt`)
  const blocked = robots && /Disallow:\s*\//i.test(robots)
  checks.push({
    id: 'A3',
    label: 'robots.txt not blocking Google',
    status: blocked ? 'fail' : 'pass',
    detail: blocked
      ? 'robots.txt is blocking Google from crawling your site. Fix this immediately.'
      : 'robots.txt is not blocking Google. Good.',
    impact_note: blocked ? "Your robots.txt file is literally telling Google not to crawl your site. You're invisible." : '',
    solution_hint: blocked ? 'This requires fixing your robots.txt configuration to allow Google full access to your site.' : '',
  })

  return checks
}

// B: On-Page SEO
async function checkOnPage(domain: string): Promise<Check[]> {
  const checks: Check[] = []
  const html = await fetchPage(`https://${domain}`)
  if (!html) {
    checks.push({ id: 'B1', label: 'Could not fetch homepage', status: 'fail', detail: 'Unable to fetch your homepage.', impact_note: "Your page title is what shows up in Google search results. Without a good one, people skip right past you.", solution_hint: 'This involves writing optimized titles that include your service and city to maximize click-through rates.' })
    return checks
  }

  // Meta title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  const title = titleMatch ? titleMatch[1].trim() : ''
  checks.push({
    id: 'B1',
    label: 'Meta title present',
    status: title.length >= 10 && title.length <= 60 ? 'pass' : title ? 'warn' : 'fail',
    detail: title
      ? `"${title.slice(0, 60)}" (${title.length} chars). ${title.length > 60 ? 'Titles over 60 chars get cut in results.' : title.length < 10 ? 'Title too short.' : 'Good length.'}`
      : 'No meta title found. Add a descriptive title between 10-60 characters.',
    impact_note: title.length >= 10 && title.length <= 60 ? '' : 'Your page title is what shows up in Google search results. Without a good one, people skip right past you.',
    solution_hint: title.length >= 10 && title.length <= 60 ? '' : 'This involves writing optimized titles that include your service and city to maximize click-through rates.',
  })

  // Meta description
  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i)
  const desc = descMatch ? descMatch[1].trim() : ''
  checks.push({
    id: 'B2',
    label: 'Meta description',
    status: desc.length >= 70 && desc.length <= 160 ? 'pass' : desc ? 'warn' : 'fail',
    detail: desc
      ? `"${desc.slice(0, 100)}" (${desc.length} chars). ${desc.length < 70 ? 'Too short -- aim for 70-160.' : desc.length > 160 ? 'Over 160 --会被截断.' : 'Good length.'}`
      : 'No meta description. This is what shows in Google search results.',
    impact_note: desc.length >= 70 && desc.length <= 160 ? '' : 'Your meta description is your sales pitch in Google results. Missing or weak ones mean fewer clicks.',
    solution_hint: desc.length >= 70 && desc.length <= 160 ? '' : 'This involves crafting compelling descriptions with a clear call-to-action that drives clicks.',
  })

  // Heading structure
  const h1s = (html.match(/<h1[^>]*>/gi) || []).length
  const h2s = (html.match(/<h2[^>]*>/gi) || []).length
  checks.push({
    id: 'B3',
    label: 'H1/H2 heading structure',
    status: h1s === 1 && h2s >= 2 ? 'pass' : h1s > 1 ? 'fail' : 'warn',
    detail: `Found ${h1s} H1, ${h2s} H2. ${h1s === 0 ? 'No H1 found -- add one.' : h1s > 1 ? `Multiple H1s found (${h1s}). Use only one per page.` : h2s < 2 ? 'Add more H2 subheadings to structure your content.' : 'Good structure.'}`,
    impact_note: h1s === 1 && h2s >= 2 ? '' : "Headings tell Google what each page is about. Missing or wrong headings mean Google doesn't understand your content.",
    solution_hint: h1s === 1 && h2s >= 2 ? '' : 'This involves restructuring your pages with proper headings that clearly communicate your services to Google.',
  })

  // Image alt text
  const imgsWithoutAlt = (html.match(/<img(?![^>]*alt=[^>]*>)(?![^>]*alt="")[^>]*>/gi) || []).length
  checks.push({
    id: 'B4',
    label: 'Image alt text',
    status: imgsWithoutAlt === 0 ? 'pass' : imgsWithoutAlt < 3 ? 'warn' : 'fail',
    detail: imgsWithoutAlt === 0
      ? 'All images have alt text. Good for accessibility and SEO.'
      : `${imgsWithoutAlt} images missing alt text. Alt text helps Google understand images and improves rankings.`,
    impact_note: imgsWithoutAlt === 0 ? '' : 'Images without alt text are invisible to Google. Your project photos and gallery images are wasted SEO potential.',
    solution_hint: imgsWithoutAlt === 0 ? '' : 'This involves adding descriptive text to every image so Google can understand and rank your visual content.',
  })

  // Canonical tag
  const hasCanonical = /<link[^>]+rel=["']canonical["']/i.test(html)
  checks.push({
    id: 'B5',
    label: 'Canonical URL tag',
    status: hasCanonical ? 'pass' : 'fail',
    detail: hasCanonical
      ? 'Canonical tag found. This prevents duplicate content issues.'
      : 'No canonical tag. Add one to tell Google which URL is the primary version.',
    impact_note: hasCanonical ? '' : 'Without a canonical tag, Google may index duplicate versions of your pages, diluting your rankings.',
    solution_hint: hasCanonical ? '' : 'This involves adding canonical tags to tell Google exactly which version of each page to rank.',
  })

  return checks
}

// C: Page Speed & Mobile
async function checkSpeedMobile(domain: string): Promise<Check[]> {
  const checks: Check[] = []
  const html = await fetchPage(`https://${domain}`)
  if (!html) {
    checks.push({ id: 'C1', label: 'Could not fetch homepage', status: 'fail', detail: 'Unable to fetch homepage.', impact_note: 'A slow site means visitors leave before it loads. Google also ranks slower sites lower.', solution_hint: 'This involves optimizing your site\'s loading performance by deferring non-critical scripts and streamlining code.' })
    return checks
  }

  // Count render-blocking resources
  const scripts = (html.match(/<script[^>]*>/gi) || []).length
  const stylesheets = (html.match(/<link[^>]+rel=["']stylesheet["']/gi) || []).length
  const blockingScore = scripts + stylesheets * 2

  checks.push({
    id: 'C1',
    label: 'Render-blocking resources',
    status: blockingScore < 5 ? 'pass' : blockingScore < 10 ? 'warn' : 'fail',
    detail: `Found ${scripts} scripts and ${stylesheets} stylesheets. ${blockingScore >= 10 ? 'Too many blocking resources -- defer or inline them.' : blockingScore >= 5 ? 'Some blocking resources -- consider deferring non-critical JS.' : 'Minimal blocking resources.'}`,
    impact_note: blockingScore < 5 ? '' : 'A slow site means visitors leave before it loads. Google also ranks slower sites lower.',
    solution_hint: blockingScore < 5 ? '' : 'This involves optimizing your site\'s loading performance by deferring non-critical scripts and streamlining code.',
  })

  // Viewport meta
  const hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html)
  checks.push({
    id: 'C2',
    label: 'Mobile viewport meta',
    status: hasViewport ? 'pass' : 'fail',
    detail: hasViewport
      ? 'Viewport meta tag found. Your site is set up for mobile.'
      : 'No viewport meta tag. Add <meta name="viewport" content="width=device-width, initial-scale=1"> for mobile.',
    impact_note: hasViewport ? '' : 'Without proper mobile setup, your site looks broken on phones. Over 60% of searches happen on mobile.',
    solution_hint: hasViewport ? '' : 'This involves adding the proper mobile configuration so your site displays correctly on every device.',
  })

  // HTTPS check
  const originalUrl = `https://${domain}`
  checks.push({
    id: 'C3',
    label: 'HTTPS enabled',
    status: originalUrl.startsWith('https://') ? 'pass' : 'fail',
    detail: originalUrl.startsWith('https://')
      ? 'HTTPS is enabled. Google prioritizes secure sites.'
      : 'Not using HTTPS. Google marks HTTP sites as insecure and penalizes rankings.',
    impact_note: originalUrl.startsWith('https://') ? '' : 'Google marks non-HTTPS sites as insecure. Visitors see a warning and leave. Rankings also suffer.',
    solution_hint: originalUrl.startsWith('https://') ? '' : 'This requires installing an SSL certificate and configuring your site to use HTTPS.',
  })

  return checks
}

// D: Keyword Rankings
async function checkKeywords(domain: string, trade: string, city: string, state: string): Promise<Check[]> {
  const checks: Check[] = []
  const queries = [
    `${trade} ${city} ${state}`,
    `best ${trade} ${city}`,
    `${trade} near me`,
    `${trade} ${state}`,
    `${trade} company ${city}`,
  ]

  let rankingsFound = 0
  for (const q of queries) {
    const serp = await serperSearch(q)
    for (const r of serp.slice(0, 10)) {
      if (r.link?.toLowerCase().includes(domain.toLowerCase())) {
        rankingsFound++
        break
      }
    }
  }

  checks.push({
    id: 'D1',
    label: 'Keyword rankings in Google',
    status: rankingsFound >= 3 ? 'pass' : rankingsFound > 0 ? 'warn' : 'fail',
    detail: rankingsFound >= 3
      ? `Found in ${rankingsFound}/${queries.length} test queries. You're ranking for real searches.`
      : rankingsFound > 0
        ? `Found in only ${rankingsFound}/${queries.length} queries. You have rankings but competitors dominate.`
        : `Not found in any of ${queries.length} test queries. You're invisible on Google for "${trade} ${city}".`,
    impact_note: rankingsFound >= 3 ? '' : "You're not showing up when people search for your services in your area. Your competitors are getting those leads.",
    solution_hint: rankingsFound >= 3 ? '' : 'This requires a combination of content optimization, local SEO, and authority building to climb the rankings.',
  })

  // Competitor snapshot
  const topSerp = await serperSearch(queries[0])
  const competitors = topSerp
    .slice(0, 5)
    .filter(r => !r.link?.toLowerCase().includes(domain.toLowerCase()))
    .map(r => r.title?.slice(0, 50) || 'Unknown')

  checks.push({
    id: 'D2',
    label: 'Top competitors',
    status: 'warn',
    detail: competitors.length > 0
      ? `Top results for "${queries[0]}": ${competitors.join(', ')}`
      : 'No clear competitors found.',
    impact_note: 'These are the businesses getting the clicks and calls that should be going to you.',
    solution_hint: 'We analyze your specific competitors and build a strategy to outrank them systematically.',
  })

  return checks
}

// E: Local SEO
async function checkLocal(domain: string, trade: string, city: string, state: string): Promise<Check[]> {
  const checks: Check[] = []
  const fullLocation = `${city} ${state}`

  // Google Business Profile
  const gbpSerp = await serperSearch(`"${trade}" "${city}" site:business.google.com OR site:google.com/maps`)
  checks.push({
    id: 'E1',
    label: 'Google Business Profile',
    status: gbpSerp.length > 0 ? 'pass' : 'fail',
    detail: gbpSerp.length > 0
      ? `Found Google Business Profile listing. Make sure it's claimed and optimized.`
      : 'No Google Business Profile found. Create one at business.google.com -- it\'s free and critical for local SEO.',
    impact_note: gbpSerp.length > 0 ? '' : 'Without a Google Business Profile, you don\'t appear in Google Maps or the local pack where most clicks happen.',
    solution_hint: gbpSerp.length > 0 ? '' : 'This involves creating and fully optimizing your Google Business Profile with all services, photos, and details.',
  })

  // Yelp
  const yelpSerp = await serperSearch(`"${trade}" "${city}" site:yelp.com`)
  checks.push({
    id: 'E2',
    label: 'Yelp presence',
    status: yelpSerp.length > 0 ? 'pass' : 'fail',
    detail: yelpSerp.length > 0
      ? 'Found on Yelp. Keep reviews fresh and respond to all of them.'
      : 'Not found on Yelp. Create and optimize a Yelp business page.',
    impact_note: yelpSerp.length > 0 ? '' : 'Yelp is one of the top sites Google pulls data from. Missing it weakens your local search presence.',
    solution_hint: yelpSerp.length > 0 ? '' : 'This involves creating and optimizing your Yelp listing with accurate info and fresh reviews.',
  })

  // Other citations
  const citationQueries = [
    { label: 'Bing Places', query: `"${trade}" "${city}" site:bing.com/maps` },
    { label: 'Apple Maps', query: `"${trade}" "${city}" site:maps.apple.com` },
    { label: 'BBB', query: `"${trade}" "${city}" site:bbb.org` },
  ]

  let citationsFound = 0
  for (const cq of citationQueries) {
    const serp = await serperSearch(cq.query)
    if (serp.length > 0) citationsFound++
  }

  checks.push({
    id: 'E3',
    label: 'Citation consistency',
    status: citationsFound >= 2 ? 'pass' : citationsFound === 1 ? 'warn' : 'fail',
    detail: citationsFound >= 2
      ? `Found ${citationsFound} citation sites. Name/address/phone (NAP) consistency across all of them is critical.`
      : citationsFound === 1
        ? `Found only 1 citation. Build more citations on Bing Places, Apple Maps, and BBB.`
        : 'No major citations found. Your NAP (name, address, phone) must be consistent across every directory.',
    impact_note: citationsFound >= 2 ? '' : "Inconsistent business info across directories confuses Google. Your rankings suffer when Google isn't sure which info is correct.",
    solution_hint: citationsFound >= 2 ? '' : 'This involves auditing and fixing your business name, address, and phone across 50+ directories.',
  })

  // City/state in title or H1
  const html = await fetchPage(`https://${domain}`)
  const text = html ? html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ') : ''
  const hasLocation = text.toLowerCase().includes(city.toLowerCase()) || text.toLowerCase().includes(state.toLowerCase())
  checks.push({
    id: 'E4',
    label: 'Location on homepage',
    status: hasLocation ? 'pass' : 'fail',
    detail: hasLocation
      ? 'Your city/state appears on the homepage. Good for local SEO.'
      : `Your city (${city}) and state (${state}) don't appear on your homepage. Add them to your homepage text.`,
    impact_note: hasLocation ? '' : "Google can't rank you for local searches if your city and state aren't on your site. Simple but critical.",
    solution_hint: hasLocation ? '' : 'This involves adding your service area and location signals to key pages so Google knows where you operate.',
  })

  return checks
}

// F: Backlinks & Authority
async function checkBacklinks(domain: string): Promise<Check[]> {
  const checks: Check[] = []

  // Count referring domains via Serper
  const backlinkSerp = await serperSearch(`site:${domain} -site:${domain}.${domain}`)
  checks.push({
    id: 'F1',
    label: 'Backlinks found',
    status: backlinkSerp.length >= 3 ? 'pass' : backlinkSerp.length > 0 ? 'warn' : 'fail',
    detail: backlinkSerp.length >= 3
      ? `Found ${backlinkSerp.length} pages linking to your site. You have a backlink foundation.`
      : backlinkSerp.length > 0
        ? `Only ${backlinkSerp.length} backlink found. You need more high-quality backlinks to compete.`
        : "No backlinks found. Backlinks are one of Google's top ranking factors.",
    impact_note: backlinkSerp.length >= 3 ? '' : "Backlinks are one of Google's top 3 ranking factors. Without them, you can't compete for competitive searches.",
    solution_hint: backlinkSerp.length >= 3 ? '' : 'This involves building quality links from local partners, industry sites, and directories to strengthen your authority.',
  })

  // Domain age hint (rough)
  const whoisSerp = await serperSearch(`"${domain}" "registered" OR "created" OR "established"`)
  checks.push({
    id: 'F2',
    label: 'Domain authority signals',
    status: 'warn',
    detail: backlinkSerp.length >= 5
      ? `Decent backlink profile. Focus on earning links from local partners, vendors, and industry sites.`
      : `Low backlink count. Focus on local citations, guest posts, and partnerships to build authority.`,
    impact_note: 'Building authority takes time but is essential for long-term rankings. Your competitors with more authority will keep outranking you.',
    solution_hint: 'We build a link earning strategy focused on local relevance and industry authority.',
  })

  return checks
}

function generateActions(sections: Record<string, Check[]>): Action[] {
  const actions: Action[] = []
  const all = Object.values(sections).flat()

  if (all.find(c => c.id === 'A3' && c.status === 'fail')) actions.push({ priority: 'CRITICAL', action: 'Fix robots.txt -- it is blocking Google from crawling your site' })
  if (all.find(c => c.id === 'C3' && c.status === 'fail')) actions.push({ priority: 'CRITICAL', action: 'Enable HTTPS -- Google penalizes insecure sites' })
  if (all.find(c => c.id === 'E1' && c.status === 'fail')) actions.push({ priority: 'HIGH', action: 'Create a Google Business Profile at business.google.com' })
  if (all.find(c => c.id === 'D1' && c.status === 'fail')) actions.push({ priority: 'HIGH', action: `Target low-competition local keywords with blog posts and service pages` })
  if (all.find(c => c.id === 'B1' && c.status === 'fail')) actions.push({ priority: 'HIGH', action: 'Add a descriptive meta title (10-60 characters)' })
  if (all.find(c => c.id === 'B2' && c.status === 'fail')) actions.push({ priority: 'HIGH', action: 'Add a meta description (70-160 characters)' })
  if (all.find(c => c.id === 'B3' && c.status === 'fail')) actions.push({ priority: 'HIGH', action: 'Fix your heading structure -- use one H1 and multiple H2s' })
  if (all.find(c => c.id === 'E3' && c.status === 'fail')) actions.push({ priority: 'HIGH', action: 'Build citations on Bing Places, Apple Maps, Yelp, and BBB' })
  if (all.find(c => c.id === 'F1' && c.status === 'fail')) actions.push({ priority: 'MEDIUM', action: 'Earn backlinks from local partners, industry associations, or local news' })
  if (all.find(c => c.id === 'C2' && c.status === 'fail')) actions.push({ priority: 'MEDIUM', action: 'Add mobile viewport meta tag to your HTML head' })
  if (all.find(c => c.id === 'B4' && c.status === 'fail')) actions.push({ priority: 'MEDIUM', action: 'Add alt text to all images -- helps SEO and accessibility' })
  if (all.find(c => c.id === 'E4' && c.status === 'fail')) actions.push({ priority: 'MEDIUM', action: `Add your city and state to your homepage text` })

  return actions.slice(0, 8)
}

function calculateScore(sections: Record<string, Check[]>): number {
  const all = Object.values(sections).flat()
  if (all.length === 0) return 0
  let pts = 0
  for (const c of all) {
    if (c.status === 'pass') pts += 1
    else if (c.status === 'warn') pts += 0.5
  }
  return Math.round((pts / all.length) * 100)
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    })
  }

  try {
    const body: SEORequest = await req.json()
    const { domain, trade, city, state } = body
    if (!domain) return new Response(JSON.stringify({ error: 'Domain required' }), { status: 400 })

    const [A, B, C, D, E, F] = await Promise.all([
      checkIndex(domain),
      checkOnPage(domain),
      checkSpeedMobile(domain),
      checkKeywords(domain, trade, city, state),
      checkLocal(domain, trade, city, state),
      checkBacklinks(domain),
    ])

    const sections = { A, B, C, D, E, F }
    const score = calculateScore(sections)
    const actions = generateActions(sections)

    return new Response(JSON.stringify({ domain, trade, city, state, score, timestamp: new Date().toISOString(), sections, actions }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message || 'Internal error' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})
