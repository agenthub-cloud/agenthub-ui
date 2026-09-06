/** 阶段 5 超集冒烟:agents 选择器与 kbs 双归属(见 docs/divergence-log.md)。 */
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import MessageInput from '../../src/chat-ui/components/MessageInput.vue'

const agents = [
  { agentId: 1, agentName: '研究员', description: '检索分析' },
  { agentId: 2, agentName: '写手', description: '成文' }
]
const kbs = [{ kbId: 7, kbName: '产品知识库', status: '0' }]

describe('MessageInput ruoyi 超集', () => {
  it('不传 agents 时智能体选择器不渲染(desktop/extension 不受影响)', () => {
    const w = mount(MessageInput, { props: { models: [] } })
    expect(w.find('.chat-agent-pick').exists()).toBe(false)
  })

  it('传 agents 渲染选择器,点击项发 change-agent', async () => {
    const w = mount(MessageInput, { props: { models: [], agents } })
    expect(w.find('.chat-agent-pick').exists()).toBe(true)
    await w.find('.chat-agent-pick .tool-btn__trigger').trigger('click')
    const items = w.findAll('.skill-pick__item')
    expect(items.length).toBe(2)
    await items[0].trigger('click')
    expect(w.emitted('change-agent')[0]).toEqual([1])
  })

  it('kbs 双归属:传 kbs 时渲染清单,toggleKb 同时发 change-kb 与 change-kbs', async () => {
    const w = mount(MessageInput, { props: { models: [], kbs, kbIds: [] } })
    await w.find('.kb-pick .tool-btn__trigger').trigger('click')
    const item = w.find('.kb-pick__item')
    expect(item.exists()).toBe(true)
    await item.trigger('click')
    expect(w.emitted('change-kb')[0]).toEqual([[7]])
    expect(w.emitted('change-kbs')[0]).toEqual([[7]])
  })

  it('不传 kbs 时 KB 菜单走内部拉取模式(不发 change-kbs)', async () => {
    const w = mount(MessageInput, { props: { models: [] } })
    await w.find('.kb-pick .tool-btn__trigger').trigger('click')
    expect(w.emitted('change-kbs')).toBeUndefined()
  })
})
