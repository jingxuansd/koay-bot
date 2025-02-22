import { parseStreamData } from "./streamParser"

// 处理流式数据
export async function handleStreamData(stream: ReadableStream, port: chrome.runtime.Port) {
  console.log('开始处理流式数据...')
  const reader = stream.getReader()
  try {
    let isPortConnected = true
    port.onDisconnect.addListener(() => {
      isPortConnected = false
      console.log('端口连接已断开')
      if (reader && !reader.closed) {
        reader.cancel()
      }
    })

    while (isPortConnected) {
      const { done, value } = await reader.read()
      if (done) {
        console.log('流式数据接收完成')
        break
      }

      const decodedData = new TextDecoder().decode(value)
      console.log('接收到数据块:', decodedData)

      // 使用parseStreamData工具函数解析数据
      const content = parseStreamData(decodedData)
      if (content) {
        // 将实际的对话内容发送到content script
        port.postMessage({
          type: 'STREAM_DATA',
          data: content
        })
      }
    }
    // 发送完成信号
    console.log('发送完成信号')
    port.postMessage({ type: 'STREAM_END' })
  } catch (error) {
    console.error('读取流数据失败:', error)
    console.error('错误详情:', error instanceof Error ? error.stack : '未知错误')
    port.postMessage({
      type: 'STREAM_ERROR',
      error: (error as Error).message || '处理消息失败，请稍后重试'
    })
  } finally {
    console.log('清理资源：释放reader锁定并断开端口连接')
    try {
      reader.releaseLock()
    } catch (error) {
      console.error('释放reader锁定失败:', error)
    }
  }
}