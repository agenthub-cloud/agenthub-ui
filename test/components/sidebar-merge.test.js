/** SessionSidebar 合并冒烟:desktop 基座 + 项目弹层 + showAppEntries。 */
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import SessionSidebar from '../../src/components/SessionSidebar.vue'

const baseProps = {
  sessions: [{ sessionId: 's1', title: '第一会话', updateTime: '2026-09-06 10:00:00' }],
  currentSessionId: 's1',
  projects: [{ projectId: 1, projectName: '项目A', description: '描述' }],
  projectSessions: { 1: [{ sessionId: 's2', title: '项目会话' }] },
  expandedProjectIds: [1]
}

describe('components SessionSidebar 合并冒烟(Task 5)', () => {
  it('桌面形态(showAppEntries 默认 true):nav 与 rail 入口渲染', () => {
    const w = mount(SessionSidebar, { props: baseProps })
    expect(w.find('.sidebar__nav').exists()).toBe(true)
    expect(w.findAll('.sidebar__nav-item').length).toBe(3)
    // 折叠态 rail 入口
    const rail = mount(SessionSidebar, { props: { ...baseProps, collapsed: true } })
    expect(rail.findAll('.sidebar__rail-action').length).toBeGreaterThanOrEqual(5)
  })

  it('showAppEntries=false:入口区块隐藏,会话列表仍可用', async () => {
    const w = mount(SessionSidebar, { props: { ...baseProps, showAppEntries: false } })
    expect(w.find('.sidebar__nav').exists()).toBe(false)
    // 用户菜单:设置组隐藏,语言/帮助/退出保留
    await w.find('.sidebar__user-card').trigger('click')
    expect(w.findAll('.sidebar__menu-group').length).toBe(2)
    expect(w.text()).not.toContain('设置')
    expect(w.text()).toContain('退出登录')
    const rail = mount(SessionSidebar, { props: { ...baseProps, showAppEntries: false, collapsed: true } })
    expect(rail.findAll('.sidebar__rail-action').length).toBe(3) // 品牌/新对话/搜索
  })

  it('showAccountFooter=false:只隐藏账户区,保留应用入口、项目和会话', () => {
    const w = mount(SessionSidebar, { props: { ...baseProps, showAccountFooter: false } })
    expect(w.find('.sidebar__foot').exists()).toBe(false)
    expect(w.find('.sidebar__nav').exists()).toBe(true)
    expect(w.find('.sidebar__projects').exists()).toBe(true)
    expect(w.find('.sidebar__list').exists()).toBe(true)

    const rail = mount(SessionSidebar, {
      props: { ...baseProps, showAccountFooter: false, collapsed: true }
    })
    expect(rail.find('.sidebar__rail-action--profile').exists()).toBe(false)
    expect(rail.findAll('.sidebar__rail-action').length).toBeGreaterThanOrEqual(5)
  })

  it('项目菜单:••• 打开 Teleport 弹层,编辑/删除 emit 项目对象', async () => {
    const w = mount(SessionSidebar, { props: baseProps, attachTo: document.body })
    await w.find('.sidebar__project-more').trigger('click')
    const menu = document.body.querySelector('.sidebar__project-menu')
    expect(menu).toBeTruthy()
    const [editBtn] = menu.querySelectorAll('button')
    editBtn.click()
    await w.vm.$nextTick()
    expect(w.emitted('edit-project')[0][0]).toMatchObject({ projectId: 1 })
    expect(document.body.querySelector('.sidebar__project-menu')).toBeNull()
    w.unmount()
  })
})
