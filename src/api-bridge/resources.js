/** 资源/技能 REST 转发：由宿主注入，页面不依赖 axios、token 或具体运行环境。 */
import { getUiBridge } from '../uiBridge.js'

const b = () => getUiBridge()?.resources

export const listDesktopSkills = (...a) => b()?.desktop(...a)
export const getSkill = (...a) => b()?.get(...a)
export const addSkill = (...a) => b()?.create(...a)
export const updateSkill = (...a) => b()?.update(...a)
export const delSkill = (...a) => b()?.remove(...a)
export const listSkillFiles = (...a) => b()?.listFiles(...a)
export const uploadSkillFile = (...a) => b()?.uploadFile(...a)
export const delSkillFile = (...a) => b()?.removeFile(...a)
