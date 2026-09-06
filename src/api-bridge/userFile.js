/** userFile REST 转发:实现由宿主经 configureUiBridge 注入(桥契约 userFile 组)。 */
import { getUiBridge } from '../uiBridge.js'

const b = () => getUiBridge()?.userFile

export const saveWorkspaceFileToUserFiles = (...a) => b()?.saveFromWorkspace(...a)
export const listUserFiles = (...a) => b()?.list(...a)
export const getUserFileQuota = (...a) => b()?.quota(...a)
export const uploadUserFile = (...a) => b()?.upload(...a)
export const renameUserFile = (...a) => b()?.rename(...a)
export const deleteUserFile = (...a) => b()?.remove(...a)
export const getUserFilePreviewUrl = (...a) => b()?.previewUrl(...a)
export const readUserFileText = (...a) => b()?.readText(...a)
export const downloadUserFileBlob = (...a) => b()?.downloadToDevice(...a)
