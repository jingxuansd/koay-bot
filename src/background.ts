import { openai } from './api/openai'
import { deepseek } from './api/deepseek'

type ModelType = 'deepseek-r1' | 'chatgpt'

// 处理来自content script的消息
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === 'CHAT_MESSAGE') {
    handleChatMessage(request.message)
      .then(response => sendResponse({ success: true, data: response }))
      .catch(error => sendResponse({ success: false, error: error.message }))
    return true // 保持消息通道打开，等待异步响应
  } else if (request.type === 'OPEN_OPTIONS_PAGE') {
    chrome.runtime.openOptionsPage()
    sendResponse({ success: true })
    return true
  }
})

// 处理聊天消息
async function handleChatMessage(message: string) {
  // 从storage获取配置
  const { model, apiKey } = await chrome.storage.local.get(['model', 'apiKey'])
  
  if (!apiKey) {
    throw new Error('请先配置API密钥')
  }

  // 根据选择的模型调用不同的API
  switch (model as ModelType) {
    case 'deepseek-r1':
      return await deepseek.chat(message, apiKey)
    case 'chatgpt':
      return await openai.chat(message, apiKey)
    default:
      throw new Error('不支持的语言模型')
  }
}