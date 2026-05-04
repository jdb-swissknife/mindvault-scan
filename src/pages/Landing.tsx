import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScanLine, ArrowRight, Search, Zap, Target, MapPin } from 'lucide-react'
import { TRADES, US_STATES, type SEORequest } from '../types'

export default function Landing() {
  const navigate = useNavigate()
  const [form, setForm] = useState<SEORequest>({ domain: '', trade: '', city: '', state: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.domain || !form.trade || !form.city || !form.state) return
    sessionStorage.setItem('scan_request', JSON.stringify(form))
    navigate('/scanning')
  }

  const features = [
    { icon: Search, title: 'Google Rankings', desc: 'See if you show up for the keywords your customers actually search.' },
    { icon: Zap, title: 'Page Speed', desc: 'Check load times and mobile performance. Google penalizes slow sites.' },
    { icon: Target, title: 'Keyword Gaps', desc: 'Find the terms your competitors rank for that you\'re missing.' },
    { icon: MapPin, title: 'Local SEO', desc: 'Google Business Profile, citations, and local pack visibility.' },
  ]

  return (
    <div className="min-h-screen bg-[#0a1230] text-white">
      <header className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-2">
          <ScanLine className="w-7 h-7 text-[#10b981]" />
          <span className="font-bold text-lg">MindVault Scan</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
            Scan your site.<br />
            <span className="text-[#10b981]">See what's holding you back.</span>
          </h1>
          <p className="text-white/60 text-lg">
            Free 30-second SEO audit. Check your Google rankings, page speed, local SEO, and get a fix-it plan.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-xl mx-auto bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1">Your Website</label>
            <input
              type="text"
              placeholder="yourcompany.com"
              value={form.domain}
              onChange={e => setForm(f => ({ ...f, domain: e.target.value }))}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#10b981]"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">Trade</label>
              <select
                value={form.trade}
                onChange={e => setForm(f => ({ ...f, trade: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#10b981] appearance-none"
              >
                <option value="" className="bg-[#0a1230]">Select trade...</option>
                {TRADES.map(t => <option key={t} value={t} className="bg-[#0a1230]">{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">State</label>
              <select
                value={form.state}
                onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#10b981] appearance-none"
              >
                <option value="" className="bg-[#0a1230]">State...</option>
                {US_STATES.map(s => <option key={s} value={s} className="bg-[#0a1230]">{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">City</label>
            <input
              type="text"
              placeholder="Minneapolis"
              value={form.city}
              onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#10b981]"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            Run SEO Scan <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
          {features.map(f => (
            <div key={f.title} className="bg-white/5 border border-white/10 rounded-xl p-5">
              <f.icon className="w-8 h-8 text-[#10b981] mb-3" />
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-white/50">{f.desc}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-white/30 text-sm mt-12">
          Powered by MindVault Studio. From scan to done-for-you SEO.
        </p>
      </main>
    </div>
  )
}
