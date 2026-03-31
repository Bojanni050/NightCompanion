import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, RefreshCcw } from 'lucide-react'
import { toast } from 'sonner'
import type { Screen } from '../types'

type Props = {
  onNavigate: (screen: Screen) => void
}

type PeriodKey = 'today' | '7d' | 'month' | 'all' | 'custom'

type UsageSummaryState = {
  session: { calls: number; promptTokens: number; completionTokens: number; totalTokens: number; costUsd: number }
  today: { calls: number; promptTokens: number; completionTokens: number; totalTokens: number; costUsd: number }
  lastAction: null | {
    calls: number
    promptTokens: number
    completionTokens: number
    totalTokens: number
    costUsd: number
    providerId: string
    modelId: string
    endpoint: string
    createdAt: string
  }
}

function buildEmptySummary(): UsageSummaryState {
  return {
    session: { calls: 0, promptTokens: 0, completionTokens: 0, totalTokens: 0, costUsd: 0 },
    today: { calls: 0, promptTokens: 0, completionTokens: 0, totalTokens: 0, costUsd: 0 },
    lastAction: null,
  }
}

function formatCost(value: number): string {
  if (!Number.isFinite(value)) return '0.0000'
  return value.toFixed(4)
}

function formatTokens(value: number): string {
  if (!Number.isFinite(value)) return '0'
  return Math.round(value).toLocaleString()
}

export default function TokenCostWidget({ onNavigate }: Props) {
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [period, setPeriod] = useState<PeriodKey>('today')
  const [customDays, setCustomDays] = useState(30)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailTotals, setDetailTotals] = useState<{ calls: number; totalTokens: number; costUsd: number }>({ calls: 0, totalTokens: 0, costUsd: 0 })
  const [summary, setSummary] = useState<UsageSummaryState>(() => buildEmptySummary())
  const [currency, setCurrency] = useState<'usd' | 'eur'>('usd')
  const [eurRate, setEurRate] = useState<number>(1)

  const fetchAll = async () => {
    try {
      const [summaryResult, settingsResult] = await Promise.all([
        window.electronAPI.usage.getSummary(),
        window.electronAPI.settings.getAiConfigState(),
      ])

      if (summaryResult.error || !summaryResult.data) {
        throw new Error(summaryResult.error || 'Failed to load usage summary.')
      }

      setSummary(summaryResult.data)

      const rawCurrency = settingsResult.data?.usageCurrency
      if (rawCurrency === 'usd' || rawCurrency === 'eur') setCurrency(rawCurrency)

      const rawRate = settingsResult.data?.eurRate
      if (typeof rawRate === 'number' && Number.isFinite(rawRate) && rawRate > 0) setEurRate(rawRate)

      setLoading(false)
    } catch (error) {
      setLoading(false)
      toast.error(String(error))
    }
  }

  useEffect(() => {
    void fetchAll()
    const handle = window.setInterval(() => {
      void fetchAll()
    }, 15_000)

    return () => {
      window.clearInterval(handle)
    }
  }, [])

  const periodDays = useMemo(() => {
    if (period === 'today') return 1
    if (period === '7d') return 7
    if (period === 'month') return 30
    if (period === 'all') return 365
    return Math.max(1, Math.min(365, Math.floor(customDays)))
  }, [customDays, period])

  const fetchDetailTotals = async (days: number) => {
    setDetailLoading(true)
    try {
      const result = await window.electronAPI.usage.listDaily({ days })
      if (result.error || !result.data) {
        throw new Error(result.error || 'Failed to load usage details.')
      }

      const totals = result.data.reduce(
        (acc, row) => {
          acc.calls += row.calls
          acc.totalTokens += row.totalTokens
          acc.costUsd += row.costUsd
          return acc
        },
        { calls: 0, totalTokens: 0, costUsd: 0 }
      )

      setDetailTotals(totals)
    } catch (error) {
      toast.error(String(error))
    } finally {
      setDetailLoading(false)
    }
  }

  useEffect(() => {
    if (!expanded) return
    void fetchDetailTotals(periodDays)
  }, [expanded, periodDays])

  const formatCalls = (value: number): string => {
    if (!Number.isFinite(value)) return '0'
    return Math.round(value).toLocaleString()
  }

  const costFor = (costUsdRaw: number) => {
    const costUsd = costUsdRaw || 0
    if (currency === 'eur') return { label: '€', value: costUsd * (eurRate || 1) }
    return { label: '$', value: costUsd }
  }

  const sessionCost = costFor(summary.session.costUsd)
  const todayCost = costFor(summary.today.costUsd)
  const detailCost = costFor(detailTotals.costUsd)

  const periodButton = (key: PeriodKey, label: string) => (
    <button
      key={key}
      type="button"
      onClick={() => setPeriod(key)}
      className={[
        'px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors text-left',
        period === key ? 'bg-glow-amber/30 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-900',
      ].join(' ')}
    >
      {label}
    </button>
  )

  return (
    <div className="card p-3">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left"
      >
        <div className="grid grid-cols-[1fr_auto_auto] items-start gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">
              {loading ? '—' : `${formatCalls(summary.session.calls)} calls · ${formatTokens(summary.session.totalTokens)} tok`}
            </p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">Session usage</p>
          </div>

          <p className="text-xs font-semibold text-glow-amber mt-0.5">
            {loading ? '—' : `${sessionCost.label}${formatCost(sessionCost.value)}`}
          </p>

          <div className="mt-0.5 text-slate-500">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-[1fr_auto_auto] items-start gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">
              {loading ? '—' : `${formatCalls(summary.today.calls)} calls · ${formatTokens(summary.today.totalTokens)} tok`}
            </p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">Daily usage</p>
          </div>

          <p className="text-xs font-semibold text-glow-amber mt-0.5">
            {loading ? '—' : `${todayCost.label}${formatCost(todayCost.value)}`}
          </p>

          <div className="mt-0.5 w-4 h-4" />
        </div>
      </button>

      {expanded && (
        <div className="mt-4 rounded-xl border border-slate-800/60 bg-slate-950/40 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="grid grid-cols-2 gap-1 bg-slate-950/50 border border-slate-800 rounded-xl p-1">
                {periodButton('today', 'Today')}
                {periodButton('7d', '7 days')}
                {periodButton('month', 'Month')}
                {periodButton('all', 'All time')}
                {periodButton('custom', 'Custom')}
              </div>
            </div>

            <button
              type="button"
              className="btn-compact-ghost shrink-0"
              onClick={(e) => {
                e.stopPropagation()
                void fetchAll()
                void fetchDetailTotals(periodDays)
              }}
              title="Refresh"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {period === 'custom' && (
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-[11px] text-slate-500">Days</p>
              <input
                type="number"
                className="input !py-1.5 !text-xs !w-20"
                value={String(customDays)}
                min={1}
                max={365}
                onChange={(e) => {
                  const next = Math.max(1, Math.min(365, Number(e.target.value) || 30))
                  setCustomDays(next)
                }}
              />
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">Calls</p>
              <p className="text-sm font-semibold text-white">
                {detailLoading ? '—' : formatCalls(detailTotals.calls)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">Tokens</p>
              <p className="text-sm font-semibold text-white">
                {detailLoading ? '—' : formatTokens(detailTotals.totalTokens)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 col-span-2">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">Cost</p>
              <p className="text-sm font-semibold text-white">
                {detailLoading ? '—' : `${detailCost.label}${formatCost(detailCost.value)}`}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              className="btn-compact-ghost w-full justify-center"
              onClick={() => {
                onNavigate('usage')
              }}
            >
              View history
            </button>

            <button
              type="button"
              className="btn-compact-ghost w-full justify-center"
              onClick={() => setExpanded(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
