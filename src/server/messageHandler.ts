import { openai } from '../api/openai'
import { deepseek } from '../api/deepseek'
import { handleStreamData } from './streamHandler'


type ModelType = 'deepseek-r1' | 'chatgpt'

// 处理聊天消息
export async function handleChatMessage(message: string, reasonMode: boolean = false, port: chrome.runtime.Port) {
  // 从storage获取配置
  const { model, apiKey } = await chrome.storage.local.get(['model', 'apiKey'])
  
  if (!apiKey) {
    throw new Error('请先配置API密钥')
  }

  // 根据选择的模型调用不同的API
  switch (model as ModelType) {
    case 'deepseek-r1': {
      deepseek.chat(message, apiKey, reasonMode ? 'deepseek-reasoner' : 'deepseek-chat').then((stream) => {
        handleStreamData(stream, port)
      }).catch((error) => {
        console.error('API请求失败:', error)
        console.error('错误详情:', error instanceof Error? error.stack : '未知错误')
        port.postMessage({
          type: 'STREAM_ERROR',
          data: error instanceof Error? error.message : '未知错误'
        })
      })
      break; // 添加 break 语句防止 fallthrough
    }
    case 'chatgpt': {
      openai.chat(message, apiKey).then((stream) => {
        handleStreamData(stream, port)
      }).catch((error) => {
        console.error('API请求失败:', error)
        console.error('错误详情:', error instanceof Error? error.stack : '未知错误')
        port.postMessage({
          type: 'STREAM_ERROR',
          data: error instanceof Error? error.message : '未知错误'
        })
      })
      break; // 添加 break 语句防止 fallthrough
    }
    default:
      throw new Error('不支持的语言模型')
  }
}
