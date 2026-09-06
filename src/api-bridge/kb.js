/** kb REST 转发:实现由宿主经 configureUiBridge 注入(桥契约 kb 组)。 */
import { getUiBridge } from '../uiBridge.js'

const b = () => getUiBridge()?.kb

export const getKbDocPreview = (...a) => b()?.getDocPreview(...a)
export const downloadKbDocument = (...a) => b()?.downloadDocument(...a)
export const listKbDoc = (...a) => b()?.listDoc(...a)
/** 聊天输入框知识库选择器的选项来源(GET /ai/kb/options),宿主按各自路由实现。 */
export const listKbOptions = (...a) => b()?.listOptions(...a)
