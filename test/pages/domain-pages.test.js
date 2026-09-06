import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { configureUiBridge } from '../../src/uiBridge.js'
import { FilesView, KnowledgeBaseView, ResourceView } from '../../src/pages.js'

function installBridge() {
  configureUiBridge({
    getUser: () => ({ userName: 'tester' }),
    userFile: {
      list: vi.fn(async () => ({ files: [], storageEnabled: true })),
      quota: vi.fn(async () => ({ usedBytes: 0, quotaBytes: 1024, fileCount: 0, storageEnabled: true }))
    },
    kb: { desktop: vi.fn(async () => ({ data: [] })) },
    resources: { desktop: vi.fn(async () => ({ data: [] })) }
  })
}

afterEach(() => configureUiBridge(null))

describe('文件/知识库/资源共享页面', () => {
  it('文件页通过 bridge 拉列表与配额', async () => {
    installBridge()
    const wrapper = mount(FilesView)
    await flushPromises()
    expect(wrapper.text()).toContain('文件')
    expect(wrapper.text()).toContain('还没有文件')
    wrapper.unmount()
  })

  it('知识库与资源页在空数据下可独立挂载', async () => {
    installBridge()
    const knowledge = mount(KnowledgeBaseView)
    const resources = mount(ResourceView)
    await flushPromises()
    expect(knowledge.text()).toContain('还没有知识库')
    expect(resources.text()).toContain('还没有自己的技能')
    knowledge.unmount()
    resources.unmount()
  })
})
