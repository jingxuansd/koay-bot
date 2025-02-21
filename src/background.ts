import { openai } from './api/openai'
import { deepseek } from './api/deepseek'
import { parseStreamData } from './utils/streamParser'

// 监听扩展程序安装事件
chrome.runtime.onInstalled.addListener(() => {
  // 创建右键菜单
  chrome.contextMenus.create({
    id: 'koay-translate-full-page',
    title: 'koay 翻译全文',
    contexts: ['page']
  })
})

// 监听右键菜单点击事件
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'koay-translate-full-page' && tab?.id) {
    // 向content script发送开始翻译的消息
    chrome.tabs.sendMessage(tab.id, { type: 'START_FULL_PAGE_TRANSLATE' })
  }
})

type ModelType = 'deepseek-r1' | 'chatgpt'

// 处理来自content script的消息
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === 'OPEN_OPTIONS_PAGE') {
    chrome.runtime.openOptionsPage()
    sendResponse({ success: true })

    return true
  } else if (request.type === 'TRANSLATE_REQUEST') {
    handleTranslateMessage(request.message).then((response) => {
      if (response) {
        sendResponse({ success: true, data: response })
      } else {
        sendResponse({ success: false, error: '翻译失败，请稍后重试' })
      }
    })

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

// 处理翻译消息
async function handleTranslateMessage(message: string) {
  // 从storage获取配置
  const { model, apiKey } = await chrome.storage.local.get(['model', 'apiKey'])

  if (!apiKey) {
    throw new Error('请先配置API密钥')
  }

  try {
    // 根据选择的模型调用不同的API
    switch (model as ModelType) {
      case 'deepseek-r1':
        return await deepseek.chatNonStream(message, apiKey)
      case 'chatgpt':
        return await openai.chatNonStream(message, apiKey)
      default:
        throw new Error('不支持的语言模型')
    }
  } catch (error) {
    console.error('翻译请求失败:', error)
    throw new Error(error instanceof Error ? error.message : '翻译失败，请稍后重试')
  }
}