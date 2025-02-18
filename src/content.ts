import { marked } from 'marked'

// 定义消息接口
interface Message {
  type: 'user' | 'bot'
  content: string
  timestamp: string
}

// 声明全局变量
let chatWindow: HTMLDivElement
const AI_THINKING_MESSAGE = 'AI正在思考...'
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
      messagesContainer.appendChild(messageElement)
      // 确保滚动到最新消息
      messagesContainer.scrollTop = messagesContainer.scrollHeight
    } else {
      console.error('消息容器元素未找到')
      return null
    }

    // 只在需要时保存消息到storage
    if (saveToStorage) {
      // 保存消息到chrome.storage.sync
      const { messages = [] } = await chrome.storage.sync.get(['messages'])
      const newMessage = {
        type,
        content,
        timestamp: new Date().toISOString()
      }
      messages.push(newMessage)
      
      // 保持最近的100条消息
      if (messages.length > 100) {
        messages.shift()
      }
      
      await chrome.storage.sync.set({ messages })
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
  inputContainer.appendChild(input)
  inputContainer.appendChild(sendBtn)
  chatWindow.appendChild(inputContainer)

  // 添加发送消息事件
  const handleSendMessage = async () => {
    const message = input.value.trim()
    if (!message) return

    // 添加用户消息
    await addMessage('user', message)
    input.value = ''

    // 添加临时的思考提示
    const thinkingMessage = await addMessage('bot', AI_THINKING_MESSAGE)

    try {
      // 发送消息到background script
      const response = await chrome.runtime.sendMessage({ type: 'CHAT_MESSAGE', message })
      console.log('收到background script响应:', response)
      // 移除旧的思考提示消息
      const messagesContainer = chatWindow.querySelector('.koay-chat-messages') as HTMLDivElement
      // 检查thinkingMessage是否为HTMLElement类型并且在messagesContainer中
      if (thinkingMessage && messagesContainer.contains(thinkingMessage)) {
        messagesContainer.removeChild(thinkingMessage)
      }
      
      // 添加新的回复消息
      await addMessage('bot', response.data)
    } catch (error) {
      console.error('发送消息失败:', error)
      if (thinkingMessage) {
        thinkingMessage.innerHTML = '抱歉，发送消息失败，请检查配置是否正确。'
      } else {
        await addMessage('bot', '抱歉，发送消息失败，请检查配置是否正确。')
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
    const recentMessages = (messages as Message[]).filter(msg => !(msg.type === 'bot' && msg.content === AI_THINKING_MESSAGE)).slice(-MESSAGES_PER_PAGE)
    
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
              .filter(msg => !(msg.type === 'bot' && msg.content === AI_THINKING_MESSAGE))
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

// 初始化翻译功能
initializeTranslateEvents()