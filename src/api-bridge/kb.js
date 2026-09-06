/** kb REST 转发:实现由宿主经 configureUiBridge 注入(桥契约 kb 组)。 */
import { getUiBridge } from '../uiBridge.js'

const b = () => getUiBridge()?.kb

export const getKbDocPreview = (...a) => b()?.getDocPreview(...a)
export const downloadKbDocument = (...a) => b()?.downloadDocument(...a)
export const listKbDoc = (...a) => b()?.listDoc(...a)
/** 聊天输入框知识库选择器的选项来源(GET /ai/kb/options),宿主按各自路由实现。 */
export const listKbOptions = (...a) => b()?.listOptions(...a)
export const listDesktopKbs = (...a) => b()?.desktop(...a)
export const addKb = (...a) => b()?.create(...a)
export const updateKb = (...a) => b()?.update(...a)
export const delKb = (...a) => b()?.remove(...a)
export const getKbDocument = (...a) => b()?.getDocument(...a)
export const subscribeKbDocumentEvents = (...a) => b()?.subscribeDocumentEvents(...a)
export const uploadKbDoc = (...a) => b()?.uploadDocument(...a)
export const reprocessKbDoc = (...a) => b()?.reprocessDocument(...a)
export const renameKbDoc = (...a) => b()?.renameDocument(...a)
export const delKbDoc = (...a) => b()?.removeDocuments(...a)
export const graphDocs = (...a) => b()?.graphDocuments(...a)
export const graphExplore = (...a) => b()?.exploreGraph(...a)
export const graphEntityDetail = (...a) => b()?.graphEntity(...a)
export const graphRelationDetail = (...a) => b()?.graphRelation(...a)
export const downloadKbDocBlob = (...a) => b()?.downloadToDevice(...a)
