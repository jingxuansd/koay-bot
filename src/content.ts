import { openDB } from 'idb'
import { marked } from 'marked'

// 声明全局变量
let configWindow: HTMLDivElement
let chatWindow: HTMLDivElement

// 初始化IndexedDB
const dbPromise = openDB('koay-bot', 1, {
  upgrade(db) {
    db.createObjectStore('chats', { keyPath: 'id', autoIncrement: true })
  }
})

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

// 创建配置窗口
function createConfigWindow() {
  configWindow = document.createElement('div')
  configWindow.className = 'koay-config-window koay-config-window-hidden'
  configWindow.innerHTML = `
    <div class="koay-config-header">
      <span>设置</span>
      <button class="koay-config-close-btn" style="background: none; border: none; color: white; cursor: pointer;">✕</button>
    </div>
    <div class="koay-config-content">
      <div class="koay-config-group">
        <label>选择语言模型：</label>
        <select class="koay-model-select">
          <option value="deepseek-r1">DeepSeek-R1</option>
          <option value="chatgpt">ChatGPT</option>
        </select>
      </div>
      <div class="koay-config-group">
        <label>API密钥：</label>
        <input type="password" class="koay-api-key" placeholder="请输入API密钥" />
      </div>
      <button class="koay-config-save-btn">保存</button>
    </div>
  `
  document.body.appendChild(configWindow)

  // 绑定关闭按钮事件
  const closeBtn = configWindow.querySelector('.koay-config-close-btn')
  closeBtn?.addEventListener('click', () => {
    configWindow.classList.add('koay-config-window-hidden')
  })

  // 绑定保存按钮事件
  const saveBtn = configWindow.querySelector('.koay-config-save-btn')
  saveBtn?.addEventListener('click', saveConfig)

  // 加载已保存的配置
  loadConfig()

  return configWindow
}

// 加载配置
async function loadConfig() {
  const config = await chrome.storage.local.get(['model', 'apiKey'])
  
  if (config.model) {
    const modelSelect = configWindow.querySelector('.koay-model-select') as HTMLSelectElement
    modelSelect.value = config.model
  }
  
  if (config.apiKey) {
    const apiKeyInput = configWindow.querySelector('.koay-api-key') as HTMLInputElement
    apiKeyInput.value = config.apiKey
  }
}

// 保存配置
async function saveConfig() {
  const modelSelect = configWindow.querySelector('.koay-model-select') as HTMLSelectElement
  const apiKeyInput = configWindow.querySelector('.koay-api-key') as HTMLInputElement

  await chrome.storage.local.set({
    model: modelSelect.value,
    apiKey: apiKeyInput.value
  })

  // 显示保存成功提示
  const saveBtn = configWindow.querySelector('.koay-config-save-btn') as HTMLButtonElement
  const originalText = saveBtn.textContent
  saveBtn.textContent = '保存成功!'
  saveBtn.disabled = true

  setTimeout(() => {
    saveBtn.textContent = originalText
    saveBtn.disabled = false
    configWindow.classList.add('koay-config-window-hidden')
  }, 1500)
}

// 添加消息到聊天窗口
async function addMessage(type: 'user' | 'bot', content: string) {
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
  } else {
    console.error('消息容器元素未找到')
  }
  // 确保 messagesContainer 存在后再设置滚动位置
  if (messagesContainer) {
    messagesContainer.scrollTop = messagesContainer.scrollHeight
  }

  // 保存消息到IndexedDB
  const db = await dbPromise
  await db.add('chats', {
    type,
    content,
    timestamp: new Date().toISOString()
  })
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
    <button class="koay-settings-btn" style="float: right; background: none; border: none; color: white; cursor: pointer;">⚙️</button>
  `
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

    try {
      // 发送消息到background script
      const response = await chrome.runtime.sendMessage({ type: 'CHAT_MESSAGE', message })
      console.log('收到background script响应:', response)
      // 添加机器人回复
      await addMessage('bot', response.data)
    } catch (error) {
      console.error('发送消息失败:', error)
      await addMessage('bot', '抱歉，发送消息失败，请检查配置是否正确。')
    }
  }

  sendBtn.addEventListener('click', handleSendMessage)
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleSendMessage()
    }
  })

  document.body.appendChild(chatWindow)

  // 添加设置按钮点击事件
  const settingsBtn = chatWindow.querySelector('.koay-settings-btn')
  settingsBtn?.addEventListener('click', () => {
    configWindow = createConfigWindow()
    loadConfig()
    configWindow.classList.remove('koay-config-window-hidden')
  })

  // 加载聊天历史
  loadChatHistory()

  return chatWindow
}

// 加载聊天历史
async function loadChatHistory() {
  const db = await dbPromise
  const messages = await db.getAll('chats')
  
  messages.forEach(message => {
    addMessage(message.type, message.content)
  })
}

// 初始化
createBotIcon()