import { openai } from './api/openai'
import { deepseek } from './api/deepseek'
import { parseStreamData } from './utils/streamParser'

type ModelType = 'deepseek-r1' | 'chatgpt'

// 处理来自content script的消息
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === 'CHAT_MESSAGE') {
    if (!request.message) {
      sendResponse({ success: false, error: '消息内容不能为空' })
      return true
    }
    sendResponse({ success: true }) // 立即响应以确认消息已收到
    return true
  } else if (request.type === 'OPEN_OPTIONS_PAGE') {
    chrome.runtime.openOptionsPage()
    sendResponse({ success: true })
    return true
  }
})

// 监听连接请求
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'chat') {
    port.onMessage.addListener(async (request) => {
      if (request.type === 'CHAT_MESSAGE') {
        try {
          const stream = await handleChatMessage(request.message, request.reasonMode || false)
          await handleStreamData(stream, port)
        } catch (error) {
          console.error('处理消息失败:', error)
          port.postMessage({
            type: 'STREAM_ERROR',
            error: error instanceof Error ? error.message : '处理消息失败，请稍后重试'
          })
          port.disconnect()
        }
      }
    })

    port.onDisconnect.addListener(() => {
      console.log('连接已断开')
    })
  }
})

// 处理流式数据
async function handleStreamData(stream: ReadableStream, port: chrome.runtime.Port) {
  console.log('开始处理流式数据...')
  const reader = stream.getReader()
  try {
    let isPortConnected = true
    port.onDisconnect.addListener(() => {
      isPortConnected = false
      console.log('端口连接已断开')
      reader.cancel()
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

// 处理聊天消息
async function handleChatMessage(message: string, reasonMode: boolean = false) {
  // 从storage获取配置
  const { model, apiKey } = await chrome.storage.local.get(['model', 'apiKey'])
  
  if (!apiKey) {
    throw new Error('请先配置API密钥')
  }

  // 根据选择的模型调用不同的API
  switch (model as ModelType) {
    case 'deepseek-r1':
      return await deepseek.chat(message, apiKey, reasonMode ? 'deepseek-reasoner' : 'deepseek-chat')
    case 'chatgpt':
      return await openai.chat(message, apiKey)
    default:
      throw new Error('不支持的语言模型')
  }
}