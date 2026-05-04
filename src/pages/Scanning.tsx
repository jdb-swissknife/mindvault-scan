import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Code, Zap, Target, MapPin, Link2, BarChart3, CheckCircle2 } from 'lucide-react'
import { type SEORequest, type SEOResult } from '../types'
import { runSEO, SCAN_STEPS } from '../lib/audit'

const ICONS: Record<string, React.ElementType> = {
  search: Search,
  code: Code,
  zap: Zap,
  target: Target,
  'map-pin': MapPin,
  link: Link2,
  'file-bar-chart': BarChart3,
}

export default function Scanning() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [error, setError] = useState('')
  const [request, setRequest] = useState<SEORequest | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('scan_request')
    if (!stored) {
      navigate('/')
      return
    }
    const req: SEORequest = JSON.parse(stored)
    setRequest(req)

    // Start the real audit
    runSEO(req)
      .then((result: SEOResult) => {
        let step = currentStep
        const finishInterval = setInterval(() => {
          step++
          if (step >= SCAN_STEPS.length) {
            clearInterval(finishInterval)
            sessionStorage.setItem('scan_result', JSON.stringify(result))
            navigate('/results')
          } else {
            setCurrentStep(step)
          }
        }, 200)
      })
      .catch(err => {
        setError(err.message || 'Scan failed. Please try again.')
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Progress animation
  useEffect(() => {
    if (error) return
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < SCAN_STEPS.length - 1) return prev + 1
        return prev
      })
    }, 4000)
    return () => clearInterval(interval)
  }, [error])

  const progress = Math.min(((currentStep + 1) / SCAN_STEPS.length) * 100, 95)

  return (
    <div className="min-h-screen bg-[#111111] text-white flex flex-col">
      <header className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-2">
          <img src="/logo.png" alt="MindVault" className="h-8 w-8" />
          <span className="font-bold text-lg">Mind<span className="text-[#c2703e]">Vault</span> Scan</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center">
          {/* Scan animation */}
          <div className="relative w-32 h-32 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full border-2 border-[#c2703e]/30" />
            <div className="absolute inset-3 rounded-full border-2 border-[#c2703e]/50" />
            <div className="absolute inset-6 rounded-full border-2 border-[#c2703e]/70" />
            <div className="absolute inset-0 rounded-full bg-[#c2703e]/10 animate-ping" style={{ animationDuration: '2s' }} />
            <div className="absolute inset-12 rounded-full bg-[#c2703e] flex items-center justify-center">
              <Search className="w-6 h-6 text-white" />
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-2 font-serif">
            Scanning {request?.domain || 'your site'}...
          </h2>
          <p className="text-white/50 mb-8">
            {request ? `${request.trade} in ${request.city}, ${request.state}` : 'Running full SEO audit'}
          </p>

          {/* Progress bar */}
          <div className="w-full bg-white/10 rounded-full h-2 mb-6">
            <div
              className="bg-[#c2703e] h-2 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Steps */}
          <div className="space-y-3 text-left">
            {SCAN_STEPS.map((step, i) => {
              const Icon = ICONS[step.icon] || Search
              const isDone = i < currentStep
              const isActive = i === currentStep
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-300 ${
                    isActive ? 'bg-white/10' : isDone ? 'bg-white/5' : 'opacity-40'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-[#c2703e] shrink-0" />
                  ) : (
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#c2703e] animate-pulse' : 'text-white/40'}`} />
                  )}
                  <span className={`text-sm ${isActive ? 'text-white font-medium' : isDone ? 'text-white/60' : 'text-white/40'}`}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>

          {error && (
            <div className="mt-8 bg-red-500/20 border border-red-500/30 rounded-xl p-4">
              <p className="text-red-300 text-sm">{error}</p>
              <button
                onClick={() => navigate('/')}
                className="mt-3 text-sm text-white/70 underline hover:text-white"
              >
                Try again
              </button>
            </div>
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
