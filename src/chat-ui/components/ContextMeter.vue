<template>
  <div ref="wrapRef" class="ctx-wrap" :class="`ctx-wrap--${placement}`">
    <button type="button" class="ctx-meter" :class="levelClass" :title="tooltipText" @click="toggle">
      <svg class="ctx-meter__ring" viewBox="0 0 18 18" width="18" height="18" aria-hidden="true">
        <circle
            class="ctx-meter__track"
            cx="9" cy="9" r="7"
            fill="none"
            stroke-width="3"
          />
          <circle
            class="ctx-meter__fill"
            cx="9" cy="9" r="7"
            fill="none"
            stroke-width="3"
            :stroke-dasharray="miniDash"
            transform="rotate(-90 9 9)"
          />
        </svg>
    </button>

    <Teleport to="body">
      <Transition name="ctx-pop">
        <div v-if="open" ref="popperRef" class="ctx-meter-popper" :style="popperStyle">
        <div class="ctx-panel">
      <div class="ctx-panel__head">
        <span class="ctx-panel__title">当前上下文</span>
        <span class="ctx-panel__nums">
          <span v-if="!trustworthy" class="ctx-panel__approx" title="含估算值">≈</span>
          {{ formatK(used) }} / {{ formatK(budget) }} · {{ percentDisplay }}%
        </span>
      </div>

      <div class="ctx-panel__donut-wrap">
        <svg class="ctx-panel__donut" viewBox="0 0 132 132" width="132" height="132">
          <!-- 底轨:全周 -->
          <circle
            cx="66" cy="66" r="52"
            fill="none"
            stroke="var(--ai-fill-4)"
            stroke-width="15"
          />
          <!-- 分段:按 budget 全周比例绘制 -->
          <g transform="rotate(-90 66 66)">
            <circle
              v-for="(seg, i) in donutSegments"
              :key="seg.key + '-' + i"
              cx="66" cy="66" r="52"
              fill="none"
              :stroke="seg.color"
              stroke-width="15"
              :stroke-dasharray="seg.dasharray"
              :stroke-dashoffset="seg.dashoffset"
              stroke-linecap="butt"
            />
          </g>
          <text x="66" y="62" text-anchor="middle" class="ctx-panel__center-pct">
            {{ percentDisplay }}%
          </text>
          <text x="66" y="78" text-anchor="middle" class="ctx-panel__center-label">
            当前已用
          </text>
        </svg>
      </div>

      <ul v-if="segments.length" class="ctx-panel__legend">
        <li v-for="(seg, i) in segments" :key="seg.key + '-' + i" class="ctx-panel__legend-row">
          <i class="ctx-panel__dot" :style="{ background: colorAt(i) }" />
          <span class="ctx-panel__legend-label">{{ seg.label }}</span>
          <span class="ctx-panel__legend-pct">{{ segmentPct(seg) }}%</span>
        </li>
      </ul>

      <!-- 轮内峰值:持久化上下文很空时,仍能看到本会话曾经多挤(ruoyi 分叉并入,design §3.3) -->
      <div v-if="showEnhancedDetails && showPeak" class="ctx-panel__peak" :title="peakTitle">
        主智能体历史峰值 {{ formatK(peakUsed) }}（{{ peakPercentDisplay }}%）
      </div>

      <!--
        会话消耗(ruoyi 分叉并入):与上面的环图是两个口径 —— 环图量「当前 prompt 占窗口多少」(不含子智能体,
        它们无状态、不占父的窗口),这里量「累计花掉多少」(含子智能体,无上限)。
        用堆叠条而不是第二个环:环形自带"容量上限"暗示,而消耗没有上限。
        后端未回 agents 明细时(旧口径)回退到 desktop 的两行摘要。
      -->
      <div v-if="showEnhancedDetails && spendAgents.length" class="ctx-panel__spend">
        <div class="ctx-panel__spend-head">
          <span class="ctx-panel__spend-title">会话消耗</span>
          <span class="ctx-panel__spend-total">{{ formatK(spendTotal) }}</span>
        </div>

        <div class="ctx-panel__spend-bar">
          <i
            v-for="(a, i) in spendAgents"
            :key="a.key"
            class="ctx-panel__spend-slice"
            :style="{ width: a.percent + '%', background: a.color }"
          />
        </div>

        <div
          v-for="(a, i) in spendAgents"
          :key="a.key + '-row'"
          class="ctx-panel__spend-row"
          :class="{ 'is-rest': a.isRest }"
        >
          <i class="ctx-panel__dot" :style="{ background: a.color }" />
          <span class="ctx-panel__spend-name" :title="a.name">{{ a.name }}</span>
          <span class="ctx-panel__spend-tok">{{ formatK(a.tokens) }}</span>
          <span class="ctx-panel__spend-pct">{{ a.percentDisplay }}%</span>
        </div>

        <div class="ctx-panel__spend-foot">
          <span>输入 {{ formatK(spendPrompt) }} · 输出 {{ formatK(spendCompletion) }}</span>
          <span>{{ spendCalls }} 次调用</span>
        </div>
      </div>

      <div v-else class="ctx-panel__summary">
        <div class="ctx-panel__summary-row">
          <span class="ctx-panel__summary-label">本会话总 Token</span>
          <span class="ctx-panel__summary-value">{{ formatK(spendTotal) }}</span>
        </div>
        <div class="ctx-panel__summary-row">
          <span class="ctx-panel__summary-label">Token 命中率</span>
          <span
            class="ctx-panel__summary-value"
            :class="{ 'is-success': cacheHitMetric?.tone === 'success' }"
          >{{ cacheHitRateDisplay }}</span>
        </div>
      </div>

      <!-- 指标行(ruoyi 分叉并入):与 spend 明细同代的增强口径,旧口径不渲染避免与摘要重复 -->
      <div v-if="showEnhancedDetails && spendAgents.length && metrics.length" class="ctx-panel__metrics">
        <div
          v-for="(m, i) in metrics"
          :key="m.key + '-' + i"
          class="ctx-panel__metric"
          :class="m.tone ? 'is-' + m.tone : ''"
        >
          <span class="ctx-panel__metric-label">{{ m.label }}</span>
          <span class="ctx-panel__metric-value">{{ formatMetric(m) }}</span>
        </div>
      </div>
    </div>
      </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

/* ---- 弹出面板(替代后台版的 el-popover) ---- */
const open = ref(false)
const wrapRef = ref(null)
const popperRef = ref(null)
const popperStyle = ref({})

/**
 * 面板定位:视口内夹紧。默认让面板右缘对齐按钮右缘,
 * 窄侧栏里按钮靠左时右对齐会把面板挤出屏幕,这里把 left/top 夹回视口边界。
 */
function positionPopper() {
  const wrap = wrapRef.value
  const popper = popperRef.value
  if (!wrap || !popper) return
  const EDGE = 8
  const vw = window.innerWidth
  const vh = window.innerHeight
  const rect = wrap.getBoundingClientRect()
  const width = Math.min(300, vw - EDGE * 2)
  const height = popper.offsetHeight
  let left = rect.right - width
  left = Math.max(EDGE, Math.min(left, vw - width - EDGE))
  let top = props.placement === 'down' ? rect.bottom + EDGE : rect.top - EDGE - height
  top = Math.max(EDGE, Math.min(top, vh - height - EDGE))
  popperStyle.value = { width: `${width}px`, left: `${left}px`, top: `${top}px` }
}

function toggle() {
  open.value = !open.value
  if (open.value) {
    nextTick(positionPopper)
    window.addEventListener('resize', positionPopper)
  } else {
    window.removeEventListener('resize', positionPopper)
  }
}
function onDocClick(e) {
  // 弹层已 Teleport 到 body,不再是 .ctx-wrap 的后代,点面板内部也要算"在内"
  if (open.value && !e.target.closest('.ctx-wrap') && !e.target.closest('.ctx-meter-popper')) {
    open.value = false
    window.removeEventListener('resize', positionPopper)
  }
}
onMounted(() => document.addEventListener('mousedown', onDocClick))
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocClick)
  window.removeEventListener('resize', positionPopper)
})

/** 单一蓝色调七阶;数组下标取色,后端已按 tokens 降序 */
const SEGMENT_COLORS = [
  '#0A84FF', '#4A9EFF', '#6FB2FF', '#8FC4FF', '#AAD3FF', '#C2E0FF', '#D8ECFF'
]

const DONUT_R = 52
const DONUT_C = 2 * Math.PI * DONUT_R
const MINI_R = 7
const MINI_C = 2 * Math.PI * MINI_R
/** 段间 1px 视觉间隔对应的弧长(近似) */
const GAP = 1.2

const props = defineProps({
  /** { used, budget, threshold, percent, segments, metrics, peakUsed, peakPercent, spend: { totalTokens, promptTokens, completionTokens, callCount, agents }, ... } */
  usage: { type: Object, default: null },
  /** 弹层方向: up 向上展开(输入条下方), down 向下展开(顶栏按钮) */
  placement: { type: String, default: 'up' },
  /** full=后台增强明细；summary=客户端原有的两行会话摘要 */
  detailMode: {
    type: String,
    default: 'full',
    validator: value => ['full', 'summary'].includes(value)
  }
})

const showEnhancedDetails = computed(() => props.detailMode === 'full')

const hasData = computed(() => !!props.usage && props.usage.budget > 0)

const used = computed(() => Number(props.usage?.used || 0))
const budget = computed(() => {
  const b = Number(props.usage?.budget)
  return Number.isFinite(b) && b > 0 ? b : 128000
})
const threshold = computed(() => Number(props.usage?.threshold || budget.value * 0.8))
const trustworthy = computed(() => props.usage?.trustworthy !== false)

const percent = computed(() => {
  if (props.usage?.percent != null) return Number(props.usage.percent)
  return budget.value > 0 ? (used.value * 100) / budget.value : 0
})

const percentDisplay = computed(() => {
  const p = percent.value
  return Number.isFinite(p) ? (Math.round(p * 10) / 10) : 0
})

/** 历史峰值(ruoyi 分叉并入):漏传时回落到当前 used */
const peakUsed = computed(() => {
  const p = Number(props.usage?.peakUsed)
  return Number.isFinite(p) && p > 0 ? p : used.value
})

const peakPercent = computed(() => {
  if (props.usage?.peakPercent != null) return Number(props.usage.peakPercent)
  return budget.value > 0 ? (peakUsed.value * 100) / budget.value : 0
})

const peakPercentDisplay = computed(() => {
  const p = peakPercent.value
  return Number.isFinite(p) ? (Math.round(p * 10) / 10) : 0
})

/** 峰值明显高于当前 used 时才展示,避免首轮/无工具循环时重复刷一行 */
const showPeak = computed(() => {
  if (!budget.value || peakUsed.value <= 0) return false
  return peakUsed.value > used.value * 1.05 || peakUsed.value > used.value + 500
})

const peakTitle = computed(() =>
  `主智能体历史最大 prompt_tokens=${peakUsed.value}（占预算 ${peakPercentDisplay.value}%）`
)

/** 阈值相对 budget 的比例，与后端 compactThreshold 联动 */
const warnRatio = computed(() => {
  if (!budget.value) return 0.8
  return Math.min(0.99, Math.max(0.1, threshold.value / budget.value))
})

const levelClass = computed(() => {
  const p = percent.value / 100
  if (p >= warnRatio.value) return 'is-danger'
  if (p >= warnRatio.value * 0.75) return 'is-warn'
  return 'is-ok'
})

const miniDash = computed(() => {
  const p = Math.min(1, Math.max(0, percent.value / 100))
  const len = p * MINI_C
  return `${len} ${MINI_C}`
})

const segments = computed(() => {
  const raw = props.usage?.segments
  return Array.isArray(raw) ? raw.filter(s => Number(s?.tokens) > 0) : []
})

/** 累计消耗保留总量(desktop 口径);agents 明细由下方 spendAgents 拆分(ruoyi 增强口径)。 */
const spendTotal = computed(() => Number(props.usage?.spend?.totalTokens || 0))

/** 后端同时返回总、主、子三种命中率；客户端只展示全会话汇总值。 */
const cacheHitMetric = computed(() => {
  const raw = props.usage?.metrics
  if (!Array.isArray(raw)) return null
  return raw.find(metric => metric?.key === 'cacheHitRate') || null
})

const cacheHitRateDisplay = computed(() => {
  if (!cacheHitMetric.value) return '--'
  const value = Number(cacheHitMetric.value.value)
  return `${Number.isFinite(value) ? Math.round(value * 10) / 10 : 0}%`
})

/** 指标行(ruoyi 分叉并入):透传后端给的通用指标列表 */
const metrics = computed(() => {
  const raw = props.usage?.metrics
  return Array.isArray(raw) ? raw : []
})

/* ---- 会话消耗(ruoyi 分叉并入) ---- */

/** 主智能体用中性灰,子智能体用彩色 —— 一眼分清「我这轮花的」和「派出去花的」 */
const SPEND_SELF_COLOR = '#8E8E93'
const SPEND_SUB_COLORS = ['#7F77DD', '#1D9E75', '#D85A30', '#D4537E', '#378ADD']
const SPEND_REST_COLOR = '#C7C7CC'
/** 展开几个子智能体;再多面板高度就压过环图了,主次颠倒 */
const SPEND_MAX_ROWS = 4

const spend = computed(() => props.usage?.spend || null)
const spendPrompt = computed(() => Number(spend.value?.promptTokens || 0))
const spendCompletion = computed(() => Number(spend.value?.completionTokens || 0))
const spendCalls = computed(() => Number(spend.value?.callCount || 0))

/**
 * 后端全量返回并已排好序(主智能体首位,其余降序),这里只做展示层的折叠。
 * 折叠阈值是展示决策,所以放前端 —— 改它不该动后端。
 */
const spendAgents = computed(() => {
  const raw = spend.value?.agents
  const total = spendTotal.value
  if (!Array.isArray(raw) || !raw.length || total <= 0) return []

  const pct = (t) => (Number(t) || 0) * 100 / total
  const rows = []
  let subIndex = 0

  raw.forEach((a) => {
    const isSelf = a.role === 'supervisor'
    rows.push({
      key: 'a' + a.agentId,
      name: isSelf ? '主智能体 · ' + a.agentName : a.agentName,
      tokens: Number(a.tokens) || 0,
      isSelf,
      color: isSelf ? SPEND_SELF_COLOR : SPEND_SUB_COLORS[subIndex++ % SPEND_SUB_COLORS.length]
    })
  })

  // 主智能体永不折叠(它是"你自己花的",必须一直可见);只折叠尾部的子智能体
  const keep = rows.slice(0, SPEND_MAX_ROWS + 1)
  const rest = rows.slice(SPEND_MAX_ROWS + 1)
  if (rest.length) {
    const restTokens = rest.reduce((s, r) => s + r.tokens, 0)
    keep.push({
      key: 'rest',
      name: `其他 ${rest.length} 个`,
      tokens: restTokens,
      isRest: true,
      color: SPEND_REST_COLOR
    })
  }

  return keep.map(r => {
    const p = pct(r.tokens)
    return { ...r, percent: p, percentDisplay: Math.round(p) }
  })
})

const donutSegments = computed(() => {
  if (!budget.value || !segments.value.length) return []
  let offset = 0
  return segments.value.map((seg, i) => {
    const tokens = Number(seg.tokens) || 0
    let len = (tokens / budget.value) * DONUT_C
    // 段间留缝,避免浅色糊在一起;极短段不挖缝以免消失
    if (len > GAP * 2) len -= GAP
    const dasharray = `${Math.max(0, len)} ${Math.max(0, DONUT_C - len)}`
    const dashoffset = -offset
    offset += (tokens / budget.value) * DONUT_C
    return {
      key: seg.key || String(i),
      color: colorAt(i),
      dasharray,
      dashoffset
    }
  })
})

const tooltipText = computed(() => {
  if (!hasData.value) return ''
  return `上下文 ${percentDisplay.value}%`
})

function colorAt(i) {
  if (i < SEGMENT_COLORS.length) return SEGMENT_COLORS[i]
  return SEGMENT_COLORS[SEGMENT_COLORS.length - 1]
}

function segmentPct(seg) {
  if (!used.value) return '0'
  const p = (Number(seg.tokens) || 0) * 100 / used.value
  return (Math.round(p * 10) / 10).toFixed(1).replace(/\.0$/, '')
}

function formatK(n) {
  const v = Number(n) || 0
  if (v >= 1000000) return (v / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (v >= 1000) return (v / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
  return String(Math.round(v))
}

function formatMetric(m) {
  const unit = m?.unit
  const v = m?.value
  if (unit === 'percent') {
    const n = Number(v)
    return (Number.isFinite(n) ? (Math.round(n * 10) / 10) : 0) + '%'
  }
  if (unit === 'tokens') return formatK(v)
  return v == null ? '' : String(v)
}
</script>

<style scoped lang="scss">
@use '../../tokens/ai-tokens.scss' as *;

.ctx-meter {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  cursor: pointer;
  user-select: none;
  border-radius: 6px;
  transition: background 0.15s ease;

  &:hover {
    background: var(--ai-fill-3, rgba(0, 0, 0, 0.04));
  }

  &__ring {
    display: block;
  }
  &__track {
    stroke: var(--ai-fill-4);
  }
  &__fill {
    stroke: $blue;
    transition: stroke-dasharray 0.2s ease, stroke 0.15s ease;
  }
  &.is-ok .ctx-meter__fill { stroke: $blue; }
  &.is-warn .ctx-meter__fill { stroke: $orange; }
  &.is-danger .ctx-meter__fill { stroke: $red; }
}

.ctx-panel {
  font-family: $font;
  color: $text;
  padding: 2px 0;

  &__head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 12px;
  }
  &__title {
    font-size: $ai-fs-5;
    font-weight: 600;
    color: $text;
  }
  &__nums {
    font-size: $ai-fs-6;
    color: $text2;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  &__approx {
    color: $gray3;
    margin-right: 1px;
  }

  &__donut-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 14px;
  }
  &__donut {
    display: block;
  }
  &__center-pct {
    font-size: 18px;
    font-weight: 600;
    fill: $text;
    font-variant-numeric: tabular-nums;
  }
  &__center-label {
    font-size: 11px;
    fill: $text2;
  }

  &__legend {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  &__legend-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: $ai-fs-6;
    line-height: $ai-lh-meta;
  }
  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
    border: 0.5px solid var(--border);
    box-sizing: border-box;
  }
  &__legend-label {
    flex: 1;
    color: $text2;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  &__legend-pct {
    color: $text;
    font-variant-numeric: tabular-nums;
    font-weight: 500;
  }

  &__summary {
    margin-top: 12px;
    padding-top: 10px;
    border-top: 1px solid var(--ai-fill-4);
    display: flex;
    flex-direction: column;
    gap: 7px;
  }
  &__summary-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    font-size: $ai-fs-6;
    line-height: $ai-lh-meta;
  }
  &__summary-label {
    color: $text2;
  }
  &__summary-value {
    color: $text;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
  }
  &__summary-value.is-success {
    color: $green;
  }

  /* 峰值行 + 会话消耗 + 指标行(ruoyi 分叉并入) */
  &__peak {
    margin-top: 8px;
    font-size: $ai-fs-6;
    color: $text2;
    font-variant-numeric: tabular-nums;
    text-align: center;
    line-height: $ai-lh-meta;
  }

  &__spend {
    margin-top: 12px;
    padding-top: 10px;
    border-top: 1px solid var(--ai-fill-4, #E5E5EA);
  }
  &__spend-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 8px;
  }
  &__spend-title {
    font-size: $ai-fs-6;
    color: $text;
    font-weight: 500;
  }
  &__spend-total {
    font-size: $ai-fs-5;
    color: $text;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
  }
  &__spend-bar {
    display: flex;
    height: 8px;
    border-radius: 4px;
    overflow: hidden;
    background: var(--ai-fill-4, #E5E5EA);
    margin-bottom: 10px;
  }
  &__spend-slice {
    height: 100%;
    // 极小占比也要看得见,否则堆叠条会"少一段"
    min-width: 2px;
  }
  &__spend-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: $ai-fs-6;
    line-height: $ai-lh-meta;
    padding: 2px 0;
  }
  &__spend-row.is-rest {
    color: $text2;
  }
  &__spend-name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  &__spend-tok {
    color: $text2;
    font-variant-numeric: tabular-nums;
  }
  &__spend-pct {
    color: $ai-text3;
    width: 34px;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  &__spend-foot {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-top: 10px;
    padding-top: 8px;
    border-top: 1px solid var(--ai-fill-4, #E5E5EA);
    font-size: $ai-fs-6;
    color: $text2;
  }

  &__metrics {
    margin-top: 12px;
    padding-top: 10px;
    border-top: 1px solid var(--ai-fill-4, #E5E5EA);
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  &__metric {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    font-size: $ai-fs-6;
    line-height: $ai-lh-meta;
  }
  &__metric-label {
    color: $text2;
  }
  &__metric-value {
    color: $text;
    font-variant-numeric: tabular-nums;
    font-weight: 500;
    text-align: right;
    word-break: break-all;
  }
  &__metric.is-success .ctx-panel__metric-value {
    color: $green;
  }
}

/* 弹出容器:Teleport 到 body 后 fixed 相对视口,由 JS 在视口内夹紧。
   不要放回输入框内——.chat-input 的 backdrop-filter 会劫持 fixed 定位 */
.ctx-wrap {
  position: relative;
  flex-shrink: 0;
}
.ctx-meter {
  border: none;
  background: transparent;
  padding: 0;
}
.ctx-meter-popper {
  position: fixed;
  width: 300px;
  z-index: 2147483000;
  background: var(--ai-card-bg);
  border: 1px solid var(--ai-border-3);
  border-radius: 12px;
  box-shadow: var(--shadow-card);
  padding: 14px 16px;
}
.ctx-pop-enter-active,
.ctx-pop-leave-active {
  transition: opacity 0.14s ease, transform 0.14s ease;
}
.ctx-pop-enter-from,
.ctx-pop-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>
