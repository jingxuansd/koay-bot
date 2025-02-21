import { marked } from 'marked'

// 创建翻译结果容器
function createTranslateContainer(paragraph: HTMLElement): HTMLDivElement {
  const container = document.createElement('div')
  container.className = 'koay-translate-container'
  container.style.cssText = `
    margin: 8px 0;
    padding: 12px;
    background-color: rgba(74, 144, 226, 0.05);
    border-left: 3px solid #4a90e2;
    font-size: 14px;
    line-height: 1.6;
    color: #666;
  `
  paragraph.insertAdjacentElement('afterend', container)
  return container
}

// 获取页面所有段落
function getAllParagraphs(): HTMLElement[] {
  const paragraphs = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li')
  return Array.from(paragraphs).filter(p => {
    const text = (p as HTMLElement).textContent?.trim()
    return text && text.length > 0
  }) as HTMLElement[]
}

// 处理单个段落的翻译
async function translateParagraph(paragraph: HTMLElement, port: chrome.runtime.Port): Promise<void> {
  const text = paragraph.textContent?.trim()
  if (!text) return

  const container = createTranslateContainer(paragraph)
  container.textContent = '正在翻译...'

  try {
    return new Promise((resolve, reject) => {
      let translatedText = ''

      port.onMessage.addListener(function listener(msg) {
        if (msg.type === 'STREAM_DATA') {
          translatedText += msg.data
          container.innerHTML = marked.parse(translatedText) as string
        } else if (msg.type === 'STREAM_END') {
          port.onMessage.removeListener(listener)
          resolve()
        } else if (msg.type === 'STREAM_ERROR') {
          container.textContent = '翻译失败：' + msg.error
          port.onMessage.removeListener(listener)
          reject(new Error(msg.error))
        }
      })

      port.postMessage({
        type: 'CHAT_MESSAGE',
        message: `请将以下文本翻译成中文：\n${text}`
      })
    })
  } catch (error) {
    container.textContent = '翻译失败，请重试'
    throw error
  }
}

// 初始化全文翻译功能
export function initializeFullPageTranslate() {
  // 确保DOM加载完成后再初始化事件
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTranslateListener)
  } else {
    initTranslateListener()
  }
}

// 初始化翻译事件监听器
function initTranslateListener() {
  // 监听来自background script的翻译请求
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'START_FULL_PAGE_TRANSLATE') {
      handleFullPageTranslate()
    }
  })
}

// 处理全文翻译
async function handleFullPageTranslate() {
  const paragraphs = getAllParagraphs()
  const port = chrome.runtime.connect({ name: 'chat' })

  try {
    for (const paragraph of paragraphs) {
      await translateParagraph(paragraph, port)
    }
  } catch (error) {
    console.error('全文翻译失败:', error)
    alert('翻译失败，请检查API配置或稍后重试')
  } finally {
    port.disconnect()
  }
}