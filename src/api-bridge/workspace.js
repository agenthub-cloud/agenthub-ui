/** workspace REST 转发:实现由宿主经 configureUiBridge 注入(桥契约 workspace 组)。 */
import { getUiBridge } from '../uiBridge.js'

const b = () => getUiBridge()?.workspace

export const deleteWorkspaceFile = (...a) => b()?.deleteFile(...a)
export const downloadWorkspaceFileBlob = (...a) => b()?.downloadBlob(...a)
export const getWorkspaceFile = (...a) => b()?.getFile(...a)
export const workspaceFileDownloadUrl = (...a) => b()?.downloadUrl(...a)
export const clearWorkspace = (...a) => b()?.clear(...a)
export const downloadWorkspaceZipBlob = (...a) => b()?.downloadZipBlob(...a)
export const getWorkspaceTree = (...a) => b()?.getTree(...a)
export const uploadWorkspaceFile = (...a) => b()?.upload(...a)
