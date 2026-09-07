import { afterEach, describe, expect, it } from 'vitest'
import { configureUiBridge, requestWorkspaceBlob } from '../src/uiBridge.js'

afterEach(() => configureUiBridge(null))

describe('工作区媒体下载桥', () => {
  it('将宿主直接返回的 Blob 归一化为 data 字段', async () => {
    const blob = new Blob(['image'], { type: 'image/png' })
    configureUiBridge({ baseURL: '/api', request: async () => blob })

    const result = await requestWorkspaceBlob('/file')

    expect(result.data).toBe(blob)
  })

  it('保留原生 axios 的 data 响应形态', async () => {
    const blob = new Blob(['image'], { type: 'image/png' })
    const axiosResponse = { data: blob, status: 200 }
    configureUiBridge({ baseURL: '/api', request: async () => axiosResponse })

    const result = await requestWorkspaceBlob('/file')

    expect(result).toBe(axiosResponse)
  })
})
