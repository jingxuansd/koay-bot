let maxSize = 8192 // Chrome storage.sync的单项最大限制为8KB

export async function saveMessage(type: 'user' | 'bot', content: string) {
    try {
        if (isMessageTooBig(type, content)) {
          return
        }

        // 保存消息到chrome.storage.sync
        const { messages = [] } = await chrome.storage.sync.get(['messages'])
        const newMessage = {
          type,
          content,
          timestamp: new Date().toISOString()
        }

        // 将新消息添加到数组末尾
        messages.push(newMessage)
        
        // 保持最近的消息，确保不超过配额
        while (messages.length > 0 && new TextEncoder().encode(JSON.stringify(messages)).length > maxSize) {
          messages.pop() // 移除最旧的消息
        }
        
        await chrome.storage.sync.set({ messages })
      } catch (error) {
        console.error('保存消息到storage失败:', error)
      }
}

export function isMessageTooBig(type: 'user' | 'bot', content: string) {
    const newMessage = {
      type,
      content,
      timestamp: new Date().toISOString()
    }

    // 计算新消息的大小
    const messageSize = new TextEncoder().encode(JSON.stringify(newMessage)).length

    if (messageSize > maxSize) {
      console.warn('消息太大，无法保存到storage')
      return true
    }

    return false
}