import { describe, expect, it } from 'vitest'
import { colorOf, THEME_COUNT } from '../../src/theme/ai-palette.js'

describe('ai-palette(逐字移植自 desktop utils/ai-palette.js)', () => {
  it('同一字符串永远得到同一组颜色(纯函数,不依赖顺序)', () => {
    const a = colorOf('research')
    const b = colorOf('research')
    expect(a).toEqual(b)
    expect(colorOf('x')).not.toEqual(colorOf('y'))
  })

  it('返回结构含 from/to/solid/soft,色相索引落在 8 组主题内', () => {
    const c = colorOf('kb')
    expect(c).toHaveProperty('from')
    expect(c).toHaveProperty('to')
    expect(c).toHaveProperty('solid')
    expect(c).toHaveProperty('soft')
    expect(THEME_COUNT).toBe(8)
  })
})
