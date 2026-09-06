/** 纯展示原子冒烟:最小 props 挂载不断言渲染细节,只断言不抛错。 */
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import MarkdownContent from '../../src/chat-ui/components/MarkdownContent.vue'
import ToolIcon from '../../src/chat-ui/components/steps/ToolIcon.vue'
import KbChunksView from '../../src/chat-ui/components/steps/KbChunksView.vue'
import CitationsView from '../../src/chat-ui/components/CitationsView.vue'

describe('chat-ui 原子冒烟(阶段 2 Task 3 抽取)', () => {
  it('MarkdownContent 渲染文本不抛错', () => {
    const w = mount(MarkdownContent, { props: { content: '# hello\n\n**world**' } })
    expect(w.exists()).toBe(true)
  })

  it('ToolIcon/KbChunksView 最小 props 挂载', () => {
    expect(mount(ToolIcon, { props: { name: 'shell' } }).exists()).toBe(true)
    expect(mount(KbChunksView, { props: { chunks: [] } }).exists()).toBe(true)
  })

  it('CitationsView 未配 UI 桥时安静降级(不抛错)', () => {
    const w = mount(CitationsView, { props: { citations: [], files: [], sessionId: 's1', messageId: 1 } })
    expect(w.exists()).toBe(true)
  })
})
