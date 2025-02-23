import { createSummaryButton, createSummaryContainer } from './components/summary'
import ConnectionManager from '../utils/connectionManager'

// 声明全局变量
let summaryBtn: HTMLButtonElement | null = null
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
  const contentContainer = summaryContainer.querySelector('.koay-summary-content')
  if (contentContainer) {
    contentContainer.innerHTML = '正在生成总结...'
  }
  setTimeout(() => {
    if (summaryContainer) {
      summaryContainer.style.opacity = '1'
      summaryContainer.style.transform = 'translateX(0)'
      summaryContainer.style.zIndex = '1000'
    }
  }, 0)

  const connectionManager = new ConnectionManager({
    onData: (data) => {
      if (summaryContainer) {
        const contentContainer = summaryContainer.querySelector('.koay-summary-content')
        if (contentContainer) {
          contentContainer.innerHTML = data.content
        }
      }
    },
    onError(error) {
      showError('生成总结失败，请重试' + error)
    },
    onEnd() {
      if (connectionManager) {
        connectionManager.disconnect()
      }
    }
  })

  connectionManager.connect()

  connectionManager.send({
    type: 'SUMMARY',
    data: `请总结以下文章内容，使用中文回复：\n${content}`,
    reasonMode: false
  })
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

    if (isHeading) {
      summaryBtn.className = 'koay-summary-btn'
      summaryBtn.style.display = 'inline-block'
      summaryBtn.style.position = 'relative'
      summaryBtn.style.left = '8px'
      summaryBtn.style.top = '0'
      summaryBtn.style.opacity = '1'
      summaryBtn.style.transform = 'scale(1)'
      target.appendChild(summaryBtn)
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

    if (!summaryBtn.contains(e.target as Node)) {
      summaryBtn.style.opacity = '0'
      summaryBtn.style.transform = 'scale(0.95)'
      setTimeout(() => {
        if (summaryBtn) {
          summaryBtn.style.display = 'none'
        }
      }, 300)
    }
  })
}