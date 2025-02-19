import { marked } from 'marked'

// 定义消息接口
interface Message {
  type: 'user' | 'bot'
  content: string
  timestamp: string
}

// 声明全局变量
let chatWindow: HTMLDivElement
const MESSAGES_PER_PAGE = 20

// 创建机器人图标
function createBotIcon() {
  const botIcon = document.createElement('div')
  botIcon.className = 'koay-bot-icon'
  botIcon.innerHTML = '🤖'
  document.body.appendChild(botIcon)

  // 添加点击事件
  botIcon.addEventListener('click', () => {
    const chatWindow = document.querySelector('.koay-chat-window')
    if (chatWindow) {
      chatWindow.classList.toggle('koay-chat-window-hidden')
    } else {
      createChatWindow()
    }
  })
}

// 添加消息到聊天窗口
async function addMessage(type: 'user' | 'bot', content: string, saveToStorage: boolean = true): Promise<HTMLDivElement | null> {
  try {
    const messagesContainer = chatWindow.querySelector('.koay-chat-messages') as HTMLDivElement
    const messageElement = document.createElement('div')
    messageElement.className = `koay-chat-message ${type}`
    
    // 如果是机器人消息，使用marked渲染Markdown
    if (type === 'bot') {
      try {
        // 统一将content转换为字符串，并使用marked渲染Markdown
        const markdownContent = marked.parse(String(content)) as string
        messageElement.innerHTML = markdownContent
      } catch (error) {
        // 渲染失败时，优雅降级为纯文本显示
        console.error('Markdown渲染失败:', error)
        messageElement.textContent = String(content)
      }
    } else {
      messageElement.textContent = content
    }

    // 检查messagesContainer是否存在
    if (messagesContainer) {
      // 将新消息添加到容器的末尾
      messagesContainer.appendChild(messageElement)
      // 确保滚动到底部显示最新消息
      messagesContainer.scrollTop = messagesContainer.scrollHeight
    } else {
      console.error('消息容器元素未找到')
      return null
    }

    // 只在需要时保存消息到storage
    if (saveToStorage) {
      try {
        // 保存消息到chrome.storage.sync
        const { messages = [] } = await chrome.storage.sync.get(['messages'])
        const newMessage = {
          type,
          content,
          timestamp: new Date().toISOString()
        }

        // 计算新消息的大小
        const messageSize = new TextEncoder().encode(JSON.stringify(newMessage)).length
        const maxSize = 8192 // Chrome storage.sync的单项最大限制为8KB

        if (messageSize > maxSize) {
          console.warn('消息太大，无法保存到storage')
          return messageElement
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

    return messageElement
  } catch (error) {
    console.error('添加消息失败:', error)
    return null
  }
}

// 创建聊天窗口
function createChatWindow() {
  chatWindow = document.createElement('div')
  chatWindow.className = 'koay-chat-window'

  // 创建标题栏
  const header = document.createElement('div')
  header.className = 'koay-chat-header'
  header.innerHTML = `
    <span>Koay Bot</span>
    <button class="koay-fullscreen-btn">⛶</button>
    <button class="koay-settings-btn" style="float: right; background: none; border: none; color: white; cursor: pointer;">⚙️</button>
  `

  // 添加全屏按钮点击事件
  const fullscreenBtn = header.querySelector('.koay-fullscreen-btn')
  fullscreenBtn?.addEventListener('click', () => {
    chatWindow.classList.toggle('fullscreen')
    // 更新全屏按钮图标
    if (fullscreenBtn instanceof HTMLButtonElement) {
      fullscreenBtn.textContent = chatWindow.classList.contains('fullscreen') ? '⛶' : '⛶'
    }
  })
  chatWindow.appendChild(header)

  // 创建消息区域
  const messagesContainer = document.createElement('div')
  messagesContainer.className = 'koay-chat-messages'
  chatWindow.appendChild(messagesContainer)

  // 创建输入区域
  const inputContainer = document.createElement('div')
  inputContainer.className = 'koay-chat-input'
  const input = document.createElement('input')
  input.type = 'text'
  input.placeholder = '输入消息...'
  const sendBtn = document.createElement('button')
  sendBtn.textContent = '发送'
  sendBtn.style.marginLeft = '8px'
  
  // 添加Reason按钮
  const reasonBtn = document.createElement('button')
  reasonBtn.textContent = 'Reason'
  reasonBtn.className = 'koay-reason-btn'
  reasonBtn.style.marginLeft = '8px'
  reasonBtn.style.backgroundColor = '#f5f5f5'
  reasonBtn.style.border = '1px solid #ddd'
  reasonBtn.style.borderRadius = '4px'
  reasonBtn.style.padding = '4px 8px'
  reasonBtn.style.cursor = 'pointer'

  // 从storage获取reason状态
  chrome.storage.local.get(['reasonMode']).then(({ reasonMode = false }) => {
    reasonBtn.style.backgroundColor = reasonMode ? '#4a90e2' : '#f5f5f5'
    reasonBtn.style.color = reasonMode ? 'white' : 'black'
  })

  // 添加点击事件
  reasonBtn.addEventListener('click', async () => {
    const { reasonMode = false } = await chrome.storage.local.get(['reasonMode'])
    const newReasonMode = !reasonMode
    await chrome.storage.local.set({ reasonMode: newReasonMode })
    reasonBtn.style.backgroundColor = newReasonMode ? '#4a90e2' : '#f5f5f5'
    reasonBtn.style.color = newReasonMode ? 'white' : 'black'
  })

  inputContainer.appendChild(input)
  inputContainer.appendChild(reasonBtn)
  inputContainer.appendChild(sendBtn)
  chatWindow.appendChild(inputContainer)

  // 添加发送消息事件
  // 修改handleSendMessage函数中的端口连接处理
  // 处理用户消息的函数
  async function handleUserMessage(message: string): Promise<void> {
    await addMessage('user', message)
  }
  
  // 处理机器人消息的函数
  async function handleBotMessage(): Promise<{ connectionManager: ConnectionManager, messageElement: HTMLDivElement }> {
    const botMessage = await addMessage('bot', '', false)
    if (!botMessage) throw new Error('创建消息元素失败')
  
    const connectionManager = new ConnectionManager({
      onData: (content) => {
        if (botMessage) {
          botMessage.innerHTML = content
        }
      },
      onError: (error: unknown) => {
        if (botMessage) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          const formattedError = errorMessage.includes('Receiving end does not exist') 
            ? '无法建立连接，请检查扩展是否正常运行。如果问题持续，请尝试重新加载页面。' 
            : `抱歉，接收消息失败：${errorMessage}`
          botMessage.innerHTML = formattedError
        }
      },
      onEnd: () => {
        if (connectionManager) {
          connectionManager.disconnect()
        }
      }
    })
  
    connectionManager.connect()
    return { connectionManager, messageElement: botMessage }
  }
  
  // 主消息处理函数
  const handleSendMessage = async () => {
    const message = input.value.trim()
    if (!message) return
  
    let connectionManager: ConnectionManager | undefined
  
    try {
      // 先处理用户消息并清空输入框，提供即时反馈
      await handleUserMessage(message)
      input.value = ''

      // 处理机器人消息
      const { connectionManager: cm } = await handleBotMessage()
      connectionManager = cm
  
      // 确保在组件卸载时断开连接
      window.addEventListener('beforeunload', () => {
        if (connectionManager) {
          connectionManager.disconnect()
        }
      })
  
      // 获取reasonMode状态
      const { reasonMode = false } = await chrome.storage.local.get(['reasonMode'])
      
      // 发送消息到background script
      connectionManager.sendMessage({ 
        type: 'CHAT_MESSAGE', 
        message,
        reasonMode
      })
    } catch (error) {
      console.error('发送消息失败:', error)
      await addMessage('bot', '抱歉，发送消息失败，请检查配置是否正确。')
      // 确保在发生错误时断开连接
      if (connectionManager) {
        connectionManager.disconnect()
      }
    }
  }

  sendBtn.addEventListener('click', handleSendMessage)
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleSendMessage()
    }
  })

  document.body.appendChild(chatWindow)

  // 添加点击事件监听器，点击页面其他区域时收起聊天窗口
  document.addEventListener('click', (e) => {
    const botIcon = document.querySelector('.koay-bot-icon')
    if (!chatWindow.contains(e.target as Node) && 
        !chatWindow.classList.contains('koay-chat-window-hidden') && 
        !botIcon?.contains(e.target as Node)) {
      chatWindow.classList.add('koay-chat-window-hidden')
    }
  })

  // 阻止聊天窗口内的点击事件冒泡
  chatWindow.addEventListener('click', (e) => {
    e.stopPropagation()
  })

  // 添加设置按钮点击事件
  const settingsBtn = chatWindow.querySelector('.koay-settings-btn')
  settingsBtn?.addEventListener('click', () => {
    // 打开新标签页进行配置
    chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS_PAGE' })
  })

  // 加载聊天历史
  loadChatHistory()

  return chatWindow
}

// 加载聊天历史
async function loadChatHistory() {
  try {
    const { messages = [] } = await chrome.storage.sync.get(['messages'])
    const recentMessages = (messages as Message[]).slice(-MESSAGES_PER_PAGE)
    
    // 创建加载更多按钮
    if (messages.length > MESSAGES_PER_PAGE) {
      const loadMoreBtn = document.createElement('button')
      loadMoreBtn.textContent = '加载更多'
      loadMoreBtn.className = 'koay-load-more-btn'
      loadMoreBtn.style.cssText = 'width: 100%; padding: 8px; margin: 8px 0; background: #f5f5f5; border: none; border-radius: 4px; cursor: pointer;'
      
      const messagesContainer = chatWindow.querySelector('.koay-chat-messages')
      if (messagesContainer) {
        messagesContainer.insertBefore(loadMoreBtn, messagesContainer.firstChild)
        
        // 添加点击事件处理
        let currentOffset = 20
        loadMoreBtn.addEventListener('click', async () => {
          try {
            const olderMessages = (messages as Message[])
              .slice(-currentOffset - MESSAGES_PER_PAGE, -currentOffset)
            if (olderMessages.length > 0) {
              for (const message of olderMessages) {
                await addMessage(message.type, message.content, false)
              }
              currentOffset += 20
              
              // 如果没有更多消息了，移除按钮
              if (currentOffset >= messages.length) {
                loadMoreBtn.remove()
              }
            }
          } catch (error) {
            console.error('加载更多消息失败:', error)
          }
        })
      }
    }
    
    // 加载最近的消息
    for (const message of recentMessages) {
      await addMessage(message.type, message.content, false)
    }
  } catch (error) {
    console.error('加载聊天历史失败:', error)
  }
}

// 初始化
createBotIcon()
import { initializeTranslateEvents } from './translate/events'
import ConnectionManager from './utils/connectionManager'

// 初始化翻译功能
initializeTranslateEvents()