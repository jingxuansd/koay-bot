import { marked } from 'marked'
import { createSummaryButton, createSummaryContainer } from './components/summary'

// 声明全局变量
let summaryBtn: HTMLDivElement | null = null
let summaryContainer: HTMLDivElement | null = null

// 初始化组件
function initializeComponents() {
  if (!summaryBtn) {
    summaryBtn = createSummaryButton()
  }
  if (!summaryContainer) {
    summaryContainer = createSummaryContainer()
  }
}

// 获取页面主要内容
function getMainContent(): string {
  // 获取所有段落和标题
  const elements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6')
  const content: string[] = []

  elements.forEach(element => {
    // 过滤掉导航栏、页脚等区域的内容
    if (!isElementInUnwantedArea(element)) {
      const text = element.textContent?.trim()
      if (text) {
        content.push(text)
      }
    }
  })

  return content.join('\n')
}

// 判断元素是否在不需要的区域
function isElementInUnwantedArea(element: Element): boolean {
  const unwantedSelectors = [
    'nav', 'footer', 'header', '.navigation', '.footer',
    '.sidebar', '.menu', '.ad', '.advertisement'
  ]

  return unwantedSelectors.some(selector =>
    element.closest(selector) !== null
  )
}

// 处理总结请求
async function handleSummary() {
  if (!summaryContainer) return

  const content = getMainContent()
  if (!content) {
    showError('未找到有效的文章内容')
    return
  }

  // 显示总结容器
  summaryContainer.style.display = 'block'
  summaryContainer.innerHTML = '正在生成总结...'
  setTimeout(() => {
    if (summaryContainer) {
      summaryContainer.style.opacity = '1'
      summaryContainer.style.transform = 'translateX(0)'
    }
  }, 0)

  const port = chrome.runtime.connect({ name: 'chat' })
  let summaryText = ''

  try {
    await new Promise((resolve, reject) => {
      port.onMessage.addListener(function listener(msg) {
        if (msg.type === 'STREAM_DATA') {
          summaryText += msg.data
          if (summaryContainer) {
            summaryContainer.innerHTML = marked.parse(summaryText) as string
          }
        } else if (msg.type === 'STREAM_END') {
          port.onMessage.removeListener(listener)
          resolve(undefined)
        } else if (msg.type === 'STREAM_ERROR') {
          port.onMessage.removeListener(listener)
          reject(new Error(msg.error))
        }
      })

      port.postMessage({
        type: 'CHAT_MESSAGE',
        message: `请总结以下文章内容，使用中文回复：\n${content}`
      })
    })
  } catch (error) {
    showError('生成总结失败，请重试')
  } finally {
    port.disconnect()
  }
}

// 显示错误信息
function showError(message: string) {
  if (summaryContainer) {
    summaryContainer.innerHTML = `<div style="color: #ff4d4f;">${message}</div>`
  }
}

// 初始化总结功能
export function initializeSummary() {
  // 确保DOM加载完成后再初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEvents)
  } else {
    initEvents()
  }
}

// 初始化事件监听
function initEvents() {
  initializeComponents()

  // 监听鼠标移动事件
  document.addEventListener('mousemove', (e) => {
    if (!summaryBtn) return

    const target = e.target as Element
    const isHeading = target.matches('h1')
    const isSummaryBtn = target.matches('koay-summary-btn')

    if (isHeading) {
      summaryBtn.className = 'koay-summary-btn'
      summaryBtn.style.display = 'inline-block'
      summaryBtn.style.position = 'relative'
      summaryBtn.style.left = '8px'
      summaryBtn.style.top = '0'
      target.appendChild(summaryBtn)
    } else if (!isSummaryBtn) {
      document.body.appendChild(summaryBtn)
      summaryBtn.style.display = 'none'
      summaryBtn.style.position = 'absolute'
    }
  })

  // 添加按钮点击事件
  if (summaryBtn) {
    summaryBtn.addEventListener('click', handleSummary)
  }

  // 点击页面其他区域时隐藏总结容器
  document.addEventListener('click', (e) => {
    if (!summaryBtn || !summaryContainer) return

    if (!summaryBtn.contains(e.target as Node) && 
        !summaryContainer.contains(e.target as Node)) {
      summaryContainer.style.opacity = '0'
      summaryContainer.style.transform = 'translateX(20px)'
      setTimeout(() => {
        if (summaryContainer) {
          summaryContainer.style.display = 'none'
        }
      }, 300)
    }
  })
}