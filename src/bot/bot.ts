import { marked } from 'marked'
import ConnectionManager from '../client/connectionManager'
import { isMessageTooBig, saveMessage } from '../storage/storage'

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
export function createBot() {
  const container = document.createElement('div');
  const shadow = container.attachShadow({ mode: 'open' });

  // 创建 link 元素加载 .css 文件
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = chrome.runtime.getURL('bot.css');
  shadow.appendChild(link);

  // 创建机器人图标
  const botIcon = document.createElement('div');
  botIcon.classList.add('koay-bot-icon');
  // 先将图标隐藏
  botIcon.style.display = 'none';
  // 添加内联样式确保初始位置正确
  const botImage = document.createElement('img');
  botImage.src = chrome.runtime.getURL('icons/bot.png');
  botIcon.appendChild(botImage);

  // 组装DOM结构
  shadow.appendChild(botIcon);
  document.body.appendChild(container);

  // 监听CSS文件加载完成事件
  link.addEventListener('load', () => {
    botIcon.style.display = 'flex';
  });
  // 添加点击事件
  botIcon.addEventListener('click', (e) => {
    e.stopPropagation();
    const chatWindow = shadow.querySelector('.koay-chat-window');
    if (chatWindow) {
      chatWindow.classList.toggle('koay-chat-window-hidden');
    } else {
      createChatWindow();
    }
  });
}

// 创建聊天窗口
export function createChatWindow() {
  const container = document.createElement('div');
  const shadow = container.attachShadow({ mode: 'open' });

  // 创建 link 元素加载 .css 文件
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = chrome.runtime.getURL('bot.css');

  chatWindow = document.createElement('div')
  chatWindow.classList.add('koay-chat-window')

  // 创建标题栏
  const header = document.createElement('div')
  header.classList.add('koay-chat-header')

  // 创建头像
  const avatar = document.createElement('img')
  avatar.src = chrome.runtime.getURL('icons/bot.png')
  avatar.className = 'koay-avatar'

  header.appendChild(avatar)

  // 创建操作容器
  const optionsContainer = document.createElement('div')
  optionsContainer.className = 'koay-chat-options'

  // 创建全屏按钮
  const fullscreenBtn = document.createElement('button')
  fullscreenBtn.className = 'koay-fullscreen-btn'
  const fullscreenIcon = document.createElement('img')
  fullscreenIcon.src = chrome.runtime.getURL('icons/dark/expand-small-to-big.png')
  fullscreenIcon.style.width = '16px'
  fullscreenIcon.style.height = '16px'
  fullscreenBtn.appendChild(fullscreenIcon)

  fullscreenBtn.addEventListener('click', () => {
    chatWindow.classList.toggle('fullscreen')
    fullscreenIcon.style.transform = chatWindow.classList.contains('fullscreen') ? 'rotate(180deg)' : 'rotate(0deg)'
  })

  optionsContainer.appendChild(fullscreenBtn)

  // 创建设置按钮
  const settingsBtn = document.createElement('button')
  settingsBtn.className = 'koay-settings-btn'
  const settingsIcon = document.createElement('img')
  settingsIcon.src = chrome.runtime.getURL('icons/dark/settings.png')
  settingsIcon.style.width = '16px'
  settingsIcon.style.height = '16px'
  settingsBtn.appendChild(settingsIcon)

  // 添加设置按钮点击事件
  settingsBtn.addEventListener('click', () => {
    // 打开新标签页进行配置
    chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS_PAGE' })
  })

  optionsContainer.appendChild(settingsBtn)

  header.appendChild(optionsContainer)

  chatWindow.appendChild(header)

  // 创建消息区域
  const messagesContainer = document.createElement('div')
  messagesContainer.className = 'koay-chat-messages'
  chatWindow.appendChild(messagesContainer)

  // 创建输入区域
  const inputContainer = document.createElement('div')
  inputContainer.className = 'koay-chat-input'
  inputContainer.style.position = 'relative'

  // 修改输入框样式
  const input = document.createElement('input')
  input.type = 'text'
  input.placeholder = '输入消息...'

  // 创建操作区域
  const actionContainer = document.createElement('div')
  actionContainer.className = 'koay-chat-actions'

  // 添加Reason标签到操作区
  const reasonContainer = document.createElement('div')
  reasonContainer.className = 'koay-reason-container'

  // 创建reason开关按钮
  const reasonLabel = document.createElement('label')
  reasonLabel.className = 'koay-reason-label'
  reasonLabel.textContent = 'Reason'

  // 从storage中获取reasonMode状态并设置初始样式
  chrome.storage.local.get(['reasonMode'], ({ reasonMode = false }) => {
    reasonLabel.style.backgroundColor = reasonMode ? '#4a90e2' : 'rgba(255, 255, 255, 0.8)'
    reasonLabel.style.color = reasonMode ? '#ffffff' : '#333333'
  })

  // 添加点击事件处理
  reasonLabel.addEventListener('click', async () => {
    const { reasonMode = false } = await chrome.storage.local.get(['reasonMode'])
    const newReasonMode = !reasonMode
    await chrome.storage.local.set({ reasonMode: newReasonMode })
    reasonLabel.style.backgroundColor = newReasonMode ? '#4a90e2' : 'rgba(255, 255, 255, 0.8)'
    reasonLabel.style.color = newReasonMode ? '#ffffff' : '#333333'
  })

  // 添加回车键监听器
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSendMessage()
    }
  })

  // 处理用户消息的函数
  async function handleUserMessage(message: string): Promise<void> {
    await addMessage('user', message)
  }
  
  // 处理机器人消息的函数
  async function handleBotMessage(reasonMode: boolean = false): Promise<{ connectionManager: ConnectionManager, messageElement: HTMLDivElement }> {
    const botMessage = document.createElement('div')
    botMessage.className = 'koay-chat-message bot'

    // 如果开启了推理模式，添加推理容器
    if (reasonMode) {
      const reasonMessageContainer = document.createElement('div')
      reasonMessageContainer.className = 'reason-message-container'
      reasonMessageContainer.innerHTML = 'AI正在思考...'
      botMessage.appendChild(reasonMessageContainer)
    }

    // 创建内容容器
    const contentContainer = document.createElement('div')
    contentContainer.className = 'content-container'
    botMessage.appendChild(contentContainer)

    // 将消息添加到聊天窗口
    const messagesContainer = chatWindow.querySelector('.koay-chat-messages')
    if (!messagesContainer) {
      throw new Error('消息容器未找到')
    }
    messagesContainer.appendChild(botMessage)
    messagesContainer.scrollTop = messagesContainer.scrollHeight
  
    const connectionManager = new ConnectionManager({
      onData: (msg) => {
        if (botMessage) {
          // 推理消息存放处
          if (msg.reasoningContent) {
            const reasonMessageContainer = botMessage.querySelector('.reason-message-container') || botMessage
            reasonMessageContainer.innerHTML = msg.reasoningContent
          }
        
          // 普通消息存放处
          if (msg.content) {
            const contentContainer = botMessage.querySelector('.content-container') || botMessage
            contentContainer.innerHTML = msg.content
          }
          
          // 获取消息容器并滚动到底部
          const messagesContainer = chatWindow.querySelector('.koay-chat-messages')
          if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight
          }
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
        // 保存机器人消息到storage
        saveMessage('bot', botMessage.innerHTML)
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

      // 获取reasonMode状态
      const { reasonMode = false } = await chrome.storage.local.get(['reasonMode'])

      // 处理机器人消息
      const { connectionManager: cm } = await handleBotMessage(reasonMode)
      connectionManager = cm
  
      // 确保在组件卸载时断开连接
      window.addEventListener('beforeunload', () => {
        if (connectionManager) {
          connectionManager.disconnect()
        }
      })
      
      // 发送消息到background script
      connectionManager.send({ 
        type: 'CHAT', 
        data: message,
        reasonMode: reasonMode
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

  // 重新组织DOM结构
  shadow.appendChild(link)
  inputContainer.appendChild(input)
  inputContainer.appendChild(actionContainer)
  actionContainer.appendChild(reasonContainer)
  reasonContainer.appendChild(reasonLabel)
  chatWindow.appendChild(inputContainer)
  shadow.appendChild(chatWindow)
  document.body.appendChild(container)

  // 添加点击事件监听器，点击页面其他区域时收起聊天窗口
  document.addEventListener('click', (e) => {
    // 添加延时处理，避免事件冲突
    setTimeout(() => {
      const botIcon = document.querySelector('.koay-bot-icon')
      if (!chatWindow.contains(e.target as Node) && 
          !chatWindow.classList.contains('koay-chat-window-hidden') && 
          !botIcon?.contains(e.target as Node)) {
        chatWindow.classList.add('koay-chat-window-hidden')
      }
    }, 50) // 50ms的延时，足够避免大多数事件冲突
  })

  // 阻止聊天窗口内的点击事件冒泡
  chatWindow.addEventListener('click', (e) => {
    e.stopPropagation()
  })

  // 加载聊天历史
  loadChatHistory()

  return chatWindow
}

// 添加消息到聊天窗口
export async function addMessage(type: 'user' | 'bot', content: string, saveToStorage: boolean = true): Promise<HTMLDivElement | null> {
  try {
    const messagesContainer = chatWindow.querySelector('.koay-chat-messages') as HTMLDivElement
    const messageElement = document.createElement('div')
    messageElement.classList.add('koay-chat-message', type)
    
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
      if (isMessageTooBig(type, content)) {
        return messageElement
      }
      saveMessage(type, content)
    }

    return messageElement
  } catch (error) {
    console.error('添加消息失败:', error)
    return null
  }
}

// 加载聊天历史
export async function loadChatHistory() {
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