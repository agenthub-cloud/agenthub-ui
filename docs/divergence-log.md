# 分叉合并差异日志(Stage 2)

逐条记录三方分叉文件的差异取舍。基座=desktop 蓝本;extension=浏览器插件分叉;ruoyi=管理端分叉。
原则:逐字保真优先,只做决策表要求的合并;拿不准产品意图的差异一律保留 desktop 基准行为并在此登记。

## Task 4:chat-ui 分叉文件

### ChatWelcome.vue(desktop 338 行 基座 + extension 355 行)

| 差异点 | 采用侧 | 理由 |
| --- | --- | --- |
| 智能体徽标区块(渐变方块 + 悬浮微动画,hero 顶部) | extension,**prop `showAgentBadge` 控制,默认 false** | 决策表指定并入为可选区块;extension 场景开启,desktop 默认不渲染 |
| 欢迎语(h1 含 title-sub「有什么我能帮上忙?」+ desc `subDesc`) | desktop | 决策表:欢迎语逐字取 desktop。extension 的 h1/subtitle「今天想一起完成什么?」是插件场景文案,不并入 |
| prompt 卡形态(desktop 3 栏大卡/wand·edit·code 图标 vs extension 2 栏小卡/doc·bulb·lang·pen 图标 + animationDelay) | desktop | extension 的快捷指令是「浏览器场景」内容(总结此页/翻译页面等),库组件不应带宿主业务文案;extension 如需可自行覆盖 |
| 免责声明(desktop 纯文本 vs extension 盾牌图标 + 措辞差异) | desktop | 同上,视觉文案属宿主场景 |
| 其余样式差(容器 max-width 820/520、aura 光晕尺寸与色标、blur、字号字重、卡片 hover/focus、welcome-in 时序等) | desktop | 决策表仅要求并入徽标区块,其余视觉差为插件场景调参 |
| `@keyframes badge-float` | extension | 徽标区块依赖,随区块一并并入 |

### MessageInput.vue(desktop 1548 行 基座 + extension 1660 行,全量 diff 157 行逐条过)

| 差异点 | 采用侧 | 理由 |
| --- | --- | --- |
| `streamingLabel` computed + `connectionState` prop(默认 'open') | extension | 决策表指定并入;断线时区分「连接恢复中/已断开/生成中」。connectionState 是 streamingLabel 的依赖,一并并入;默认 'open' 时 desktop 行为逐字不变 |
| `compact` prop + 模板 7 处守卫(slash tip/技能 chips/placeholder/技能与知识库选择器入口/kb tip)+ `--compact` 样式块(约 98 行)+ skillQuery/showSkillMenu 守卫 | extension | 计划「132 行差=侧边栏模板/样式微调」的主体即此紧凑变体;prop 默认 false,不传时 DOM/CSS 与 desktop 逐字一致;extension 侧栏场景必需。属判断项,已保守处理(纯 opt-in,零默认行为变化) |
| 模型名 span 加 `tool-btn__text--model` class | extension | compact 样式块依赖该钩子(全尺寸下无副作用) |
| `listKbOptions` 导入源 | 包内改造 | desktop/extension 均取自宿主 `api/kb`;入包后走 `src/api-bridge/kb.js` → uiBridge `kb.listOptions`(桥契约新增该键,宿主装配时注入),组件不认识宿主 axios |
| scss `@use` 路径 | 包内改造 | 指向 `../../tokens/ai-tokens.scss` |

### ContextMeter.vue(desktop 404 行 基座 + extension 447 行 + ruoyi 578 行,三版合并)

| 差异点 | 采用侧 | 理由 |
| --- | --- | --- |
| 弹层定位:desktop 原生 absolute(bottom+right)vs extension Teleport 到 body + fixed + JS 视口夹紧(positionPopper/resize 监听/外点判定调整) | extension | 布局适配类 → 转 prop;Teleport+夹紧是 desktop 行为的健壮超集(narrow 视口不再被挤出屏幕),默认 `placement='up'` 时渲染位置与 desktop 等价(right 对齐 + 上方 8px)。extension 注释:.chat-input 的 backdrop-filter 会劫持 fixed 定位,必须 Teleport |
| `placement` prop('up' 默认/'down') | extension | 布局适配类转 prop;desktop 场景不传即 'up' |
| popper z-index 70 → 2147483000 | extension | Teleport 到 body 后必须抬层级,随定位方案一并采用 |
| 峰值行:`peakUsed/peakPercent/peakPercentDisplay/showPeak/peakTitle` + `__peak` 模板与样式 | ruoyi | 决策表:数据增强类合入。漏传 peakUsed 时回落 used,desktop 数据不受影响 |
| 会话消耗堆叠条:`spend/spendAgents`(supervisor 中性灰/子智能体彩色/超 4 行折叠「其他 N 个」/rest 色)、`spendPrompt/spendCompletion/spendCalls`、`__spend*` 模板与样式 | ruoyi | 数据增强类合入。**后端未回 spend.agents 时回退 desktop 的两行摘要(本会话总 Token + Token 命中率)**——旧口径数据在合并版上渲染与 desktop 完全一致,不因增强而丢信息 |
| 指标行:`metrics` 通用透传 + `formatMetric`(percent/tokens 单位)+ `__metrics*` 样式 | ruoyi | 数据增强类合入;渲染条件 `spendAgents.length && metrics.length` —— 与会话消耗同代的增强口径一起出现,避免旧口径下与回退摘要重复展示 cacheHitRate |
| `budget` 兜底:desktop `Number.isFinite(b) && b > 0 ? b : 128000` vs ruoyi `Number(budget \|\| 0)` | desktop | ruoyi 版在 budget 缺失时 percent 变 0,desktop 兜底更稳;保留基准行为 |
| 环图底轨 `stroke="var(--ai-fill-4)"` vs ruoyi 的 `var(--ai-fill-4, #E5E5EA)` 等三处 fallback | desktop 主体 | 包内 `.ah-scope` 必加载 tokens,fallback 非必需;新增的 `__peak/__spend*/__metrics` 样式块按 ruoyi 逐字保留其 fallback(纯冗余,无害) |
| hasData 写法差异(`!!props.usage` vs `props.usage`) | desktop | 语义相同,取基座 |

### ChatTimeline.vue(desktop 292 行 基座 + ruoyi 324 行,160 行 diff 逐条过)

| 差异点 | 采用侧 | 理由 |
| --- | --- | --- |
| 逐条核对结论 | — | desktop 版已包含 ruoyi 的全部逻辑(hover 授权 userMoved/onBarEnter 防幽灵悬停/滚动重算/实时 DOM 查询取最近条/视口坐标定位预览卡),ruoyi 侧逻辑与 desktop **零差异** |
| 头部注释(音轨概念/数据契约)、props 注释、hover 授权与滚动重算的说明注释 | ruoyi | 纯文档增量,并入后组件契约(数据源=全部我的消息、jump 触发父级翻页定位)对三端可见 |
| 波形参数 PEAK/FALL/BASE(36/8/7 vs 40/10/8) | desktop | 视觉调参无对错,拿不准 → 保留基准;ruoyi 如需可在宿主侧覆盖(或后续提 prop) |
| 样式差(left 14/20px、媒体断点 860/768、条高/圆角/配色 color-mix 玻璃拟态、预览卡尺寸阴影、card 过场方向 ±5px) | desktop | 同上,插件/管理端的视觉调参不并入 |
| ruoyi 版 `import { ref, computed }`(丢了 `watch` 但仍在用 `watch`) | desktop | ruoyi 版为潜在运行时错误,desktop 正确,不采用 |

### TracePanel.vue(ruoyi 独有 445 行,入包移植)

| 差异点/改造点 | 采用侧 | 理由 |
| --- | --- | --- |
| 数据源:`getSessionTraces/getRunTrace`(@/api/ai/session) | 改 props 注入 | 任务要求:数据改 props 注入,组件只渲染。props:`sessionId/loading/overview/currentRun/spans`;emits:`open-run(runId)/back/close`,REST 由宿主装配 |
| `el-dialog` + `v-loading` 指令 | 自绘 | 库不依赖 Element Plus。壳对齐 AppConfirm 先例(Teleport + mask + 卡片),Escape 关闭对齐 el-dialog 默认;v-loading 自绘为绝对定位 spinner 层;`destroy-on-close` 语义由宿主 v-if 承担 |
| 树构建/tool_batch 折叠/折叠交互/stats 统计/格式化函数 | ruoyi 逐字 | 纯渲染逻辑,保真移植 |
| ruoyi 版死代码(`tree`/`turnNode`/`nodePct`/`tipX`/`tipY`/`tipColor`,模板零引用;系画布流程图改树形列表的残留) | 移除 | 移植(非三方合并)时的整备;若宿主要复活画布形态,从 ruoyi 版回捞。已在此登记 |
| `openRun` 内 `collapsed.clear()/hoverNode=null` 重置 | 保留语义 | 转为 `watch(currentRun)` 重置(数据改 props 后下钻目标由父级驱动) |
| ruoyi 版头部统计 `totalMs/totalTokens` 引用 `current.value` | 修正为 `props.currentRun` | props 化的对应改写(移植过程中 vitest 抓出一处漏改) |

### ChatHeader.vue(ruoyi 独有 115 行,入包移植)

| 差异点/改造点 | 采用侧 | 理由 |
| --- | --- | --- |
| `el-dropdown/el-dropdown-menu/el-dropdown-item` | 自绘 `.chat-menu`(Transition + 点外收起) | 库不依赖 Element Plus;command 语义不变('traces'/'clear'),disabled 条件逐字保留 |
| 其余模板(props/emits/指示灯/图标)与样式 | ruoyi 逐字 | 保真移植,仅 scss `@use` 指向包内 tokens |

## Task 5:SessionSidebar(desktop 1289 行 基座 + extension 1498 行)

> 三方 diff 共 1225 行;extension 整体是抽屉式布局(drawer mask/is-open/atmosphere/header 空态等),决策表只要求合入「项目菜单弹层」与桌面入口 prop 化,布局差异不并入。

| 差异点 | 采用侧 | 理由 |
| --- | --- | --- |
| 项目菜单弹层:inline 绝对定位菜单(基座)vs extension 的 Teleport 到 body + fixed + getBoundingClientRect 视口夹紧(toggleProjectMenu/activeProject/projectMenuStyle/closeProjectMenu) | extension | 决策表指定合入;侧栏底部的项目行不再把菜单挤出屏幕。emit 的项目对象与基座同引用(props.projects.find),edit-project/delete-project 语义不变 |
| 弹层随行关闭:Escape(onShortcut 分支)/resize/scroll 捕获监听/collapsed watch | extension | 弹层配套行为,一并合入(fixed 弹层不随侧栏滚动,必须监听关闭) |
| `sidebar__project-more.is-open` 激活态样式 + `.sidebar__project-menu` fixed 样式(152px/12px 圆角/32px 行高) | extension | 随弹层替换基座的 absolute 菜单样式(136px/10px/30px) |
| 桌面入口区块:rail 上 文件/知识库/资源库/偏好设置 四钮 + divider、展开态 `sidebar__nav` 三钮、用户菜单「设置」组及其分隔线 | desktop,**prop `showAppEntries` 控制,默认 true** | 决策表:桌面入口区块 prop 化;extension/ruoyi 传 false。四个 emit 声明保留(emit 定义无害),UI 随区块隐藏;语言/帮助/退出组非桌面入口,保留 |
| 抽屉式布局(mask/atmosphere orbs/AGENTHUB eyebrow/会话计数/新对话按钮文案/空态图标/底部退出卡片/会话条目 meta 行) | desktop(不并入) | 决策表为「接口级分叉」,仅两项合入;抽屉形态属插件宿主布局 |
| `isProjectExpanded(id)`(Number 归一)vs 基座 `expandedProjectIds.includes(p.projectId)` | desktop | 非决策表合入项,保留基座;归一化差异未观察到实际类型问题 |
| 项目会话条目 div+删除钮(extension)vs button(基座) | desktop | 同上 |
| `logoMark from '../assets/agenthub-logo-mark.svg'` | desktop,资产入包 | 复制 `desktop/src/assets/agenthub-logo-mark.svg` → 包内 `src/assets/`,import 路径不变 |
| `toast from '../utils/confirm'` | 包内改造 | 指向 `../composables/useConfirm.js`(同 API 模块级单例) |
| `avatarBase = import.meta.env.VITE_APP_BASE_API \|\| '/dev-api'`(desktop/extension 同) | 包内改造 | 库不读宿主 env;改走 uiBridge `getUiBridge()?.baseURL \|\| '/dev-api'`(宿主装配时按同一变量注入,行为等价) |
| scss `@use` 路径 | 包内改造 | `../../tokens/ai-tokens.scss` |

### 入包顺带的既有构建阻塞修复(非本任务分叉,登记备查)

| 文件 | 问题 | 处理 |
| --- | --- | --- |
| src/components/WorkspaceDrawer.vue / WorkspacePreviewModal.vue(1bbf578 提交) | `@use '../chat-ui/ai-tokens.scss'` 路径不存在(tokens 实际在 `src/tokens/`),barrel 齐后即构建失败 | 机械修正为 `'../tokens/ai-tokens.scss'` |
| src/index.js / src/index.d.ts(Task 6 barrel,并行工作区改动) | 导出了不存在的 `useStepDisplay`(实为 `useStepToggle`)与不存在的 `useConfirm` | 对齐模块真实导出面:`useStepToggle`;删除幻影 `useConfirm` 导出 |


## 阶段 5 MessageInput ruoyi 超集

- agents/agentId props + change-agent 事件:选择器照 skills 模式;不传 agents 整块隐藏(desktop/extension 零影响);类名用 chat-agent-pick 避开既有模型胶囊的 agent-pick。
- kbs/kbLoading props + change-kbs 事件:双归属——传 kbs 数组=页面持有清单(ruoyi),不传=内部经 uiBridge kb.listOptions 拉取(desktop/extension);toggleKb 在页面模式下双发 change-kb+change-kbs。
