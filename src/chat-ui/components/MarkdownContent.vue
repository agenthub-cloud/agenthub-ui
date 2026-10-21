<template>
  <div ref="rootEl" class="md-content" v-html="html" @click="handleContentClick"></div>

  <!-- 图片预览:Teleport 到 body,摆脱聊天区祖先的 transform/overflow 影响 -->
  <Teleport to="body">
    <div v-if="viewer" class="md-image-viewer" @click.self="closeViewer">
      <img class="md-image-viewer__img" :src="viewer.src" :alt="viewer.alt" />
      <div class="md-image-viewer__bar">
        <span class="md-image-viewer__name" :title="viewer.alt">{{ viewer.alt || '图片' }}</span>
        <a class="md-image-viewer__btn" :href="viewer.src" :download="viewer.name">下载</a>
        <button class="md-image-viewer__btn" type="button" @click="closeViewer">关闭</button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, inject, nextTick, onBeforeUnmount, onMounted, ref, unref, watch } from 'vue'
import { Marked } from 'marked'
import DOMPurify from 'dompurify'
import { requestWorkspaceBlob } from '../../uiBridge.js'

const props = defineProps({
  text: { type: String, default: '' },
  /**
   * 会话 ID。Markdown 里的相对路径图片(如 `outputs/shot.png`)属于会话工作区,
   * 必须带鉴权去下载接口取,不能交给浏览器按页面相对地址解析。
   * 聊天页已 provide('sessionId'),宿主漏传时回退注入值。
   */
  sessionId: { type: [String, Number], default: null }
})

const rootEl = ref(null)
const viewer = ref(null)

const injectedSessionId = inject('sessionId', null)
const sessionId = computed(() => {
  if (props.sessionId != null && props.sessionId !== '') return String(props.sessionId)
  const injected = unref(injectedSessionId)
  return injected != null && injected !== '' ? String(injected) : ''
})

// ==================== 工作区图片 ====================

// 只把「相对路径」当工作区文件:带 scheme(http/data/blob/file)、协议相对(//)、
// 站点绝对路径(/)的图片保持原样,交给浏览器与 DOMPurify 处理。
function isWorkspacePath(href) {
  const s = String(href || '').trim()
  if (!s) return false
  if (s.startsWith('#') || s.startsWith('//') || s.startsWith('/')) return false
  if (/^[a-z][a-z0-9+.-]*:/i.test(s)) return false
  return true
}

function normalizeWorkspacePath(href) {
  let path = String(href || '').trim()
  const cut = path.search(/[?#]/)
  if (cut >= 0) path = path.slice(0, cut)
  return path.replace(/\\/g, '/').replace(/^\.\//, '')
}

function escapeAttr(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// 每个 MarkdownContent 实例自己持有 objectURL,卸载时统一释放。
// 同一张图在流式重渲染里会反复经过 renderer,靠这个 Map 命中去重,不会重复请求。
const imageStates = new Map()

function imageKey(path) {
  return sessionId.value + '|' + path
}

function peekImage(path) {
  return imageStates.get(imageKey(path))
}

function ensureImage(path) {
  const key = imageKey(path)
  const existing = imageStates.get(key)
  if (existing) return existing.promise

  const state = { url: '', error: '', promise: null }
  imageStates.set(key, state)
  state.promise = (async () => {
    try {
      const sid = sessionId.value
      if (!sid) throw new Error('缺少会话信息')
      const res = await requestWorkspaceBlob(
        '/ai/chat/workspace/' + encodeURIComponent(sid) + '/download?path=' + encodeURIComponent(path)
      )
      const data = res && res.data
      if (!data) throw new Error('工作区未返回内容')
      const blob = data instanceof Blob ? data : new Blob([data])
      // 404/403 时后端返回 JSON 错误体,被 responseType=blob 包成 application/json。
      // 直接 createObjectURL 会得到一张「看起来加载成功」的破图,所以按类型拦掉。
      if (blob.type && blob.type.indexOf('application/json') === 0) {
        let message = '图片读取失败'
        try {
          const parsed = JSON.parse(await blob.text())
          message = parsed.msg || parsed.message || message
        } catch (e) {
          /* 非 JSON 就保留默认文案 */
        }
        throw new Error(message)
      }
      state.url = URL.createObjectURL(blob)
    } catch (e) {
      state.error = (e && (e.msg || e.message)) || '图片读取失败'
    }
    return state
  })()
  return state.promise
}

function mountImage(slot, path, state) {
  if (state.error) {
    slot.classList.add('is-error')
    const reason = state.error && state.error !== '图片读取失败' ? '（' + state.error + '）' : ''
    slot.textContent = '图片读取失败：' + path + reason
    return
  }
  if (!state.url) return
  const img = document.createElement('img')
  img.className = 'md-image'
  img.src = state.url
  img.alt = slot.getAttribute('data-md-alt') || ''
  img.loading = 'lazy'
  img.setAttribute('data-md-path', path)
  const title = slot.getAttribute('data-md-title')
  if (title) img.title = title
  slot.replaceWith(img)
}

// 每次 v-html 重写 DOM 后把未命中的占位符补成图片。
// seq 用来作废上一轮(流式输出时每次 token 都会触发)的异步回填。
let hydrateSeq = 0
async function hydrateImages() {
  const root = rootEl.value
  if (!root) return
  const seq = ++hydrateSeq
  const slots = Array.from(root.querySelectorAll('.md-image-slot[data-md-path]'))
  for (const slot of slots) {
    const path = slot.getAttribute('data-md-path')
    const state = await ensureImage(path)
    // 流式重渲染会换掉旧节点(jsdom/离屏挂载下 isConnected 也可能为 false),用根节点包含关系判断
    if (seq !== hydrateSeq || !root.contains(slot)) continue
    mountImage(slot, path, state)
  }
}

function releaseImages() {
  for (const state of imageStates.values()) {
    if (state.url) {
      try {
        URL.revokeObjectURL(state.url)
      } catch (e) {
        /* noop */
      }
    }
  }
  imageStates.clear()
}

const md = new Marked({
  breaks: true,
  gfm: true
})

md.use({
  renderer: {
    image({ href, title, text }) {
      const alt = escapeAttr(text || '')
      const titleAttr = title ? ` title="${escapeAttr(title)}"` : ''
      if (!isWorkspacePath(href)) {
        return `<img class="md-image" src="${escapeAttr(href)}" alt="${alt}"${titleAttr}>`
      }
      const path = normalizeWorkspacePath(href)
      const state = peekImage(path)
      if (state && state.error) {
        // 失败结果也缓存,避免每次流式重渲染都把同一个 404 再打一遍
        return `<span class="md-image-slot is-error" data-md-path="${escapeAttr(path)}" data-md-alt="${alt}"${titleAttr}>图片读取失败：${escapeAttr(path)}</span>`
      }
      // 注意:这里不能直接输出 blob: URL —— DOMPurify 默认会剥掉它,
      // 流式重渲染时图片会突然消失。占位符由 hydrateImages() 在 DOM 上替换成 img。
      return `<span class="md-image-slot" data-md-path="${escapeAttr(path)}" data-md-alt="${alt}" data-md-title="${escapeAttr(title || '')}">图片加载中…</span>`
    },
    code({ text, lang }) {
      const language = (lang || '').trim()
      const langLabel = language ? language.toUpperCase() : 'CODE'
      const escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')

      return `
<div class="code-block" data-lang="${language}">
  <div class="code-block__header">
    <span class="code-block__lang">${langLabel}</span>
    <span class="code-block__spacer"></span>
    <button type="button" class="code-block__copy" title="复制代码">
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M5.5 2.5h6A1.5 1.5 0 0 1 13 4v7a1.5 1.5 0 0 1-1.5 1.5h-6A1.5 1.5 0 0 1 4 11V4a1.5 1.5 0 0 1 1.5-1.5z" stroke="currentColor" stroke-width="1.3"/><path d="M3 5.5H2.5A1.5 1.5 0 0 0 1 7v6A1.5 1.5 0 0 0 2.5 14.5h6A1.5 1.5 0 0 0 10 13v-.5" stroke="currentColor" stroke-width="1.3"/></svg>
      <span class="code-block__copy-text">复制</span>
    </button>
  </div>
  <pre class="code-block__pre"><code class="code-block__code">${escaped}</code></pre>
</div>`
    }
  }
})

const html = computed(() => {
  if (!props.text) return ''
  // 读一次 sessionId:会话切换时要重新渲染,已拉取的图片走 imageStates 命中
  sessionId.value
  const raw = md.parse(props.text)
  return DOMPurify.sanitize(raw, {
    ADD_ATTR: [
      'target', 'data-lang', 'viewBox', 'd', 'stroke', 'stroke-width', 'stroke-linecap',
      'stroke-linejoin', 'fill', 'loading', 'data-md-path', 'data-md-alt', 'data-md-title'
    ],
    ADD_TAGS: ['span', 'button', 'svg', 'path', 'div', 'pre', 'code']
  })
})

// ==================== 交互:复制代码 / 预览图片 ====================

function handleContentClick(e) {
  const btn = e.target.closest('.code-block__copy')
  if (btn) {
    copyCode(btn)
    return
  }
  const img = e.target.closest('img.md-image')
  if (img && (img.currentSrc || img.src)) {
    const path = img.getAttribute('data-md-path') || ''
    viewer.value = {
      src: img.currentSrc || img.src,
      alt: img.getAttribute('alt') || '',
      name: (path.split('/').pop() || 'image').trim()
    }
  }
}

function closeViewer() {
  viewer.value = null
}

function onKeydown(e) {
  if (e.key === 'Escape' && viewer.value) closeViewer()
}

function copyCode(btn) {
  const codeEl = btn.closest('.code-block')?.querySelector('.code-block__code')
  if (!codeEl) return
  const textToCopy = codeEl.textContent || ''
  if (!textToCopy) return

  const copyAction = () => {
    const textSpan = btn.querySelector('.code-block__copy-text')
    if (textSpan) textSpan.textContent = '已复制 ✓'
    btn.classList.add('is-copied')
    setTimeout(() => {
      if (textSpan) textSpan.textContent = '复制'
      btn.classList.remove('is-copied')
    }, 1800)
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(textToCopy).then(copyAction).catch(() => fallbackCopy(textToCopy, copyAction))
  } else {
    fallbackCopy(textToCopy, copyAction)
  }
}

function fallbackCopy(text, onSuccess) {
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.select()
  try {
    document.execCommand('copy')
    if (onSuccess) onSuccess()
  } catch (_) {}
  document.body.removeChild(ta)
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  hydrateImages()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  closeViewer()
  releaseImages()
})

// flush: 'post' 保证 DOM 已经被 v-html 更新后再回填
watch(html, () => nextTick(hydrateImages), { flush: 'post' })

// 切会话:上一会话的 objectURL 不再有效,释放后按新 sessionId 重新拉
watch(sessionId, () => {
  closeViewer()
  releaseImages()
  nextTick(hydrateImages)
})
</script>

<style scoped lang="scss">
@use '../../tokens/ai-tokens.scss' as *;

.md-content {
  word-break: break-word;
  color: var(--text);
  font-size: 14.5px;
  line-height: $ai-lh-base;

  :deep(> *:first-child) { margin-top: 0; }
  :deep(> *:last-child) { margin-bottom: 0; }

  :deep(p) { margin: 0 0 12px; line-height: $ai-lh-base; }

  /* 标题层级 */
  :deep(h1), :deep(h2), :deep(h3), :deep(h4), :deep(h5), :deep(h6) {
    margin: 20px 0 10px;
    font-weight: 650;
    color: var(--text);
    line-height: $ai-lh-tight;
    letter-spacing: -0.01em;
  }
  :deep(h1) { font-size: 20px; }
  :deep(h2) { font-size: 17.5px; }
  :deep(h3) { font-size: 15.5px; }
  :deep(h4), :deep(h5), :deep(h6) { font-size: 14.5px; }

  :deep(ul), :deep(ol) {
    margin: 0 0 12px;
    padding-left: 22px;
  }
  :deep(li) {
    margin: 4px 0;
    line-height: $ai-lh-base;
  }
  :deep(li > p) { margin: 0; }

  :deep(strong) { font-weight: 600; color: var(--text); }
  :deep(em) { font-style: italic; color: var(--text-secondary); }
  :deep(del) { opacity: 0.6; }

  :deep(a) {
    color: var(--accent);
    text-decoration: none;
    font-weight: 500;
    &:hover { text-decoration: underline; }
  }

  :deep(blockquote) {
    margin: 12px 0;
    padding: 6px 14px;
    border-left: 3px solid var(--accent);
    background: var(--ai-fill-1);
    border-radius: 0 8px 8px 0;
    color: var(--text-secondary);
  }

  :deep(hr) {
    margin: 18px 0;
    border: none;
    border-top: 1px solid var(--border);
  }

  /* 行内代码 */
  :deep(code:not(.code-block__code)) {
    font-family: $mono;
    font-size: 0.9em;
    background: var(--ai-fill-2);
    color: var(--accent);
    border: 1px solid var(--border);
    padding: 1.5px 5.5px;
    border-radius: 5px;
    margin: 0 2px;
  }

  /* 现代卡片风格代码块 */
  :deep(.code-block) {
    margin: 14px 0;
    border-radius: 10px;
    overflow: hidden;
    background: var(--bg-code);
    border: 1px solid var(--border);
    box-shadow: var(--shadow-card);

    .code-block__header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: var(--bg-code-header);
      border-bottom: 1px solid var(--border);
    }

    .code-block__spacer {
      flex: 1;
    }

    .code-block__lang {
      font-family: $mono;
      font-size: 11.5px;
      font-weight: 600;
      color: var(--text-secondary);
      letter-spacing: 0.5px;
    }

    .code-block__copy {
      margin-left: auto;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 8px;
      border-radius: 5px;
      border: 1px solid var(--border);
      background: var(--ai-fill-2);
      color: var(--text-secondary);
      font-family: inherit;
      font-size: 11.5px;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        background: var(--bg-hover);
        color: var(--text);
        border-color: var(--border-strong);
      }

      &.is-copied {
        background: rgba(16, 185, 129, 0.15);
        color: var(--ok-text);
        border-color: var(--ok);
      }
    }

    .code-block__pre {
      margin: 0;
      padding: 12px 14px;
      overflow-x: auto;
      font-family: $mono;
      font-size: 13.5px;
      line-height: 1.65;
      color: var(--text-code);
      white-space: pre;
    }

    .code-block__code {
      font-family: inherit;
      color: inherit;
      background: transparent;
      padding: 0;
      border: none;
    }
  }

  /* 表格 */
  :deep(table) {
    border-collapse: collapse;
    margin: 14px 0;
    font-size: 13.5px;
    width: 100%;
    overflow-x: auto;
    display: block;
    border-radius: 8px;
    border: 1px solid var(--border);
  }
  :deep(th), :deep(td) {
    border: 1px solid var(--border);
    padding: 8px 12px;
    text-align: left;
  }
  :deep(th) {
    background: var(--ai-fill-2);
    font-weight: 600;
    color: var(--text);
  }
  :deep(tr:hover td) {
    background: var(--ai-fill-1);
  }

  :deep(img) {
    max-width: 100%;
    border-radius: 10px;
    border: 1px solid var(--border);
    margin: 8px 0;
  }

  /* 工作区图片:未加载完的占位 / 读取失败提示 */
  :deep(.md-image) {
    display: block;
    cursor: zoom-in;
  }

  :deep(.md-image-slot) {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 34px;
    margin: 8px 0;
    padding: 8px 12px;
    border: 1px dashed var(--border);
    border-radius: 8px;
    background: var(--ai-fill-1);
    color: var(--text-secondary);
    font-size: 12.5px;

    &.is-error {
      border-color: $ai-red;
      color: $ai-red;
    }
  }
}
</style>

<!-- 全屏预览挂到 body,不能放进 scoped 块 -->
<style lang="scss">
.md-image-viewer {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.78);

  &__img {
    max-width: 90vw;
    max-height: 86vh;
    object-fit: contain;
    border-radius: 6px;
    box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5);
  }

  &__bar {
    position: absolute;
    top: 16px;
    right: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__name {
    max-width: 320px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.82);
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 7px 12px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.14);
    color: #fff;
    font-size: 13px;
    text-decoration: none;
    transition: background 0.15s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.26);
      color: #fff;
      text-decoration: none;
    }
  }
}
</style>
