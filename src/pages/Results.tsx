import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, AlertTriangle, XCircle, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react'
import { type SEOResult, type SEOCheck } from '../types'
import { scoreColor, scoreLabel, scoreSummary } from '../lib/audit'
import { supabase } from '../lib/supabase'

const SECTION_LABELS: Record<string, string> = {
  A: 'Index & Coverage',
  B: 'On-Page SEO',
  C: 'Page Speed & Mobile',
  D: 'Keyword Rankings',
  E: 'Local SEO',
  F: 'Backlinks & Authority',
}

const STATUS_ICON = {
  pass: CheckCircle2,
  warn: AlertTriangle,
  fail: XCircle,
}
const STATUS_COLOR = {
  pass: 'text-[#22C55E]',
  warn: 'text-[#f59e0b]',
  fail: 'text-[#ef4444]',
}

export default function Results() {
  const navigate = useNavigate()
  const [result, setResult] = useState<SEOResult | null>(null)
  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['A', 'D']))

  useEffect(() => {
    const stored = sessionStorage.getItem('scan_result')
    if (!stored) { navigate('/'); return }
    const r: SEOResult = JSON.parse(stored)
    setResult(r)
  }, [navigate])

  const toggleSection = (key: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !result) return
    try {
      await supabase.from('seo_leads').insert({
        domain: result.domain,
        trade: result.trade,
        city: result.city,
        state: result.state,
        email,
        score: result.score,
        result_json: result,
      })
    } catch { /* still mark as sent */ }
    setEmailSent(true)
  }

  if (!result) return null

  const { domain, trade, city, state, score, sections, actions } = result

  return (
    <div className="min-h-screen bg-[#111111] text-white">
      <header className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-2">
          <img src="/logo.png" alt="MindVault" className="h-8 w-8" />
          <span className="font-bold text-lg">Mind<span className="text-[#c2703e]">Vault</span> Scan</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        {/* Score hero */}
        <div className="text-center mb-10">
          <div className="relative w-36 h-36 mx-auto mb-4">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none" stroke={scoreColor(score)} strokeWidth="8"
                strokeDasharray={`${score * 2.64} 264`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-extrabold" style={{ color: scoreColor(score) }}>{score}</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-1 font-serif">{domain}</h1>
          <p className="text-white/50 mb-2">{trade} in {city}, {state}</p>
          <p className="text-lg font-semibold" style={{ color: scoreColor(score) }}>{scoreLabel(score)}</p>
          <p className="text-white/50 text-sm mt-2 max-w-lg mx-auto">
            {scoreSummary(score, trade, city)}
          </p>
        </div>

        {/* Section breakdowns */}
        <div className="space-y-4 mb-10">
          {Object.entries(sections).map(([key, checks]) => {
            const passCount = checks.filter(c => c.status === 'pass').length
            const total = checks.length
            const expanded = expandedSections.has(key)
            return (
              <div key={key} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleSection(key)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-white/60">{SECTION_LABELS[key] || key}</span>
                    <span className="text-xs text-white/40">{passCount}/{total} passed</span>
                  </div>
                  {expanded ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                </button>
                {expanded && (
                  <div className="px-5 pb-4 space-y-3">
                    {checks.map((check: SEOCheck) => {
                      const Icon = STATUS_ICON[check.status]
                      return (
                        <div key={check.id} className="flex gap-3">
                          <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${STATUS_COLOR[check.status]}`} />
                          <div>
                            <p className="text-sm font-medium">{check.label}</p>
                            <p className="text-xs text-white/50 mt-0.5">{check.detail}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Priority actions */}
        {actions.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-10">
            <h2 className="text-lg font-bold mb-4 font-serif">Top Actions to Fix</h2>
            <div className="space-y-3">
              {actions.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    a.priority === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                    a.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>{a.priority}</span>
                  <p className="text-sm text-white/70">{a.action}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Email gate */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
          {emailSent ? (
            <div>
              <CheckCircle2 className="w-8 h-8 text-[#22C55E] mx-auto mb-2" />
              <p className="font-semibold">Report sent!</p>
              <p className="text-sm text-white/50">We'll email your full SEO report with step-by-step fixes.</p>
            </div>
          ) : (
            <form onSubmit={handleEmail}>
              <h3 className="text-lg font-bold mb-1 font-serif">Get Your Full Report</h3>
              <p className="text-sm text-white/50 mb-4">We'll email you the full breakdown with step-by-step fixes.</p>
              <div className="flex gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-[#c2703e]"
                  required
                />
                <button type="submit" className="bg-[#c2703e] hover:bg-[#a85a2a] px-5 py-2.5 rounded-lg font-semibold flex items-center gap-1 transition-colors">
                  Send <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      <footer className="border-t border-[#e7ddd3] bg-[#f7f3ee] py-6 px-4 text-center">
        <p className="text-sm italic text-[#c2703e]">Your AI Workforce, Managed.</p>
        <p className="text-xs text-stone-500 mt-2">&copy; {new Date().getFullYear()} Mind<span className="text-[#c2703e]">Vault</span> Studio. All rights reserved.</p>
      </footer>
    </div>
  )
}
