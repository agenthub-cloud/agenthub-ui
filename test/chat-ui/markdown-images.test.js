import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import MarkdownContent from '../../src/chat-ui/components/MarkdownContent.vue'
import { configureUiBridge } from '../../src/uiBridge.js'

const objectUrl = vi.fn(() => 'blob:mock-image')
const revokeObjectUrl = vi.fn()

beforeEach(() => {
  URL.createObjectURL = objectUrl
  URL.revokeObjectURL = revokeObjectUrl
  objectUrl.mockClear()
  revokeObjectUrl.mockClear()
})

afterEach(() => {
  configureUiBridge(null)
  delete URL.createObjectURL
  delete URL.revokeObjectURL
})

function flush() {
  return new Promise((resolve) => setTimeout(resolve, 0)).then(() => nextTick())
}

describe('MarkdownContent 工作区图片', () => {
  it('把会话工作区相对路径图片换成带鉴权下载的 blob 地址', async () => {
    const request = vi.fn(async () => ({ data: new Blob(['png'], { type: 'image/png' }) }))
    configureUiBridge({ baseURL: '/api', request })

    const wrapper = mount(MarkdownContent, {
      props: { text: '百度首页截图：\n\n![百度首页](outputs/baidu-home.png)', sessionId: 's-1' }
    })
    await flush()

    expect(request).toHaveBeenCalledTimes(1)
    expect(request.mock.calls[0][0].url).toBe(
      '/api/ai/chat/workspace/s-1/download?path=' + encodeURIComponent('outputs/baidu-home.png')
    )
    const img = wrapper.find('img.md-image')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('blob:mock-image')
    expect(img.attributes('alt')).toBe('百度首页')

    wrapper.unmount()
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:mock-image')
  })

  it('流式追加文本后图片仍然保留（blob 地址不经过 DOMPurify）', async () => {
    const request = vi.fn(async () => ({ data: new Blob(['png'], { type: 'image/png' }) }))
    configureUiBridge({ baseURL: '/api', request })

    const base = '![百度首页](outputs/baidu-home.png)'
    const wrapper = mount(MarkdownContent, { props: { text: base, sessionId: 's-1' } })
    await flush()
    expect(wrapper.find('img.md-image').exists()).toBe(true)

    await wrapper.setProps({ text: base + '\n\n继续' })
    await flush()

    expect(wrapper.find('img.md-image').exists()).toBe(true)
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('外链图片保持原样，不走工作区下载', async () => {
    const request = vi.fn()
    configureUiBridge({ baseURL: '/api', request })

    const wrapper = mount(MarkdownContent, {
      props: { text: '![logo](https://example.com/logo.png)', sessionId: 's-1' }
    })
    await flush()

    expect(request).not.toHaveBeenCalled()
    expect(wrapper.find('img').attributes('src')).toBe('https://example.com/logo.png')
  })

  it('下载失败时显示失败占位，而不是破图', async () => {
    const request = vi.fn(async () => ({
      data: new Blob([JSON.stringify({ code: 500, msg: '文件不存在: outputs/x.png' })], { type: 'application/json' })
    }))
    configureUiBridge({ baseURL: '/api', request })

    const wrapper = mount(MarkdownContent, {
      props: { text: '![x](outputs/x.png)', sessionId: 's-1' }
    })
    await flush()

    const slot = wrapper.find('.md-image-slot.is-error')
    expect(slot.exists()).toBe(true)
    expect(slot.text()).toContain('图片读取失败')
    expect(wrapper.find('img.md-image').exists()).toBe(false)
  })

  it('缺少会话 ID 时不做请求，保留占位', async () => {
    const request = vi.fn()
    configureUiBridge({ baseURL: '/api', request })

    const wrapper = mount(MarkdownContent, {
      props: { text: '![x](outputs/x.png)' }
    })
    await flush()

    expect(request).not.toHaveBeenCalled()
    expect(wrapper.find('.md-image-slot.is-error').text()).toContain('缺少会话信息')
  })
})
