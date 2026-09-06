/** userFile REST 转发:实现由宿主经 configureUiBridge 注入(桥契约 userFile 组)。 */
import { getUiBridge } from '../uiBridge.js'

const b = () => getUiBridge()?.userFile

export const saveWorkspaceFileToUserFiles = (...a) => b()?.saveFromWorkspace(...a)
