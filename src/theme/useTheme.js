/**
 * useTheme:主题模式('dark' | 'light' | 'system')的无 Pinia 单例 composable。
 * 移植自 desktop/src/stores/theme.js,唯一差异是去 defineStore 化(库不依赖 Pinia):
 * 模块级 ref 单例 + localStorage 持久化 + matchMedia 监听,行为逐字对齐。
 * 同步义务:desktop store 变更时本文件跟着改(见主仓 ui-kit 阶段 2 计划)。
 */
import { computed, ref } from 'vue'

const THEME_STORAGE_KEY = 'agenthub_ui_theme'

// 模块级单例:多个组件调用 useTheme() 共享同一份状态(替代 Pinia store 的全局性)。
const mode = ref(typeof localStorage !== 'undefined' ? localStorage.getItem(THEME_STORAGE_KEY) || 'light' : 'light')
const systemIsDark = ref(
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false
)

const isDark = computed(() => {
  if (mode.value === 'system') return systemIsDark.value
  return mode.value === 'dark'
})

function applyThemeClass() {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (isDark.value) {
    root.classList.add('dark')
    root.setAttribute('data-theme', 'dark')
  } else {
    root.classList.remove('dark')
    root.setAttribute('data-theme', 'light')
  }
}

function setMode(newMode) {
  if (!['dark', 'light', 'system'].includes(newMode)) return
  mode.value = newMode
  localStorage.setItem(THEME_STORAGE_KEY, newMode)
  applyThemeClass()
}

function toggleTheme() {
  if (isDark.value) {
    setMode('light')
  } else {
    setMode('dark')
  }
}

let inited = false

function initTheme() {
  if (typeof window === 'undefined' || inited) return
  inited = true

  // 监听系统主题变化
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e) => {
      systemIsDark.value = e.matches
      if (mode.value === 'system') {
        applyThemeClass()
      }
    }
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', onChange)
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(onChange)
    }
  }

  applyThemeClass()
}

export function useTheme() {
  return {
    mode,
    isDark,
    setMode,
    toggleTheme,
    initTheme
  }
}
