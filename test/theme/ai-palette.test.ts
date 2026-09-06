import { describe, expect, it } from 'vitest'
import { colorOf, glowOf, gradientOf, paletteOf, softOf, THEME_COUNT } from '../../src/theme/ai-palette.js'

describe('ai-palette(逐字移植自 desktop utils/ai-palette.js)', () => {
  it('同一字符串永远得到同一组颜色(纯函数,不依赖顺序)', () => {
    expect(paletteOf('research')).toEqual(paletteOf('research'))
    expect(colorOf('x')).not.toBe(colorOf('y'))
  })

  it('paletteOf 返回 from/to/solid/soft 结构,THEME_COUNT 为 8', () => {
    const p = paletteOf('kb')
    expect(p).toHaveProperty('from')
    expect(p).toHaveProperty('to')
    expect(p).toHaveProperty('solid')
    expect(p).toHaveProperty('soft')
    expect(THEME_COUNT).toBe(8)
  })

  it('显式 theme 参数走指定色,派生函数返回字符串', () => {
    const p = paletteOf('anything', 3)
    expect(gradientOf('anything', 3)).toBe(`linear-gradient(135deg, ${p.from}, ${p.to})`)
    expect(colorOf('anything', 3)).toBe(p.solid)
    expect(softOf('anything', 3)).toBe(p.soft)
    expect(typeof glowOf('anything', 3)).toBe('string')
  })
})
