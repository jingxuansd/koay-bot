import { createTranslateButton, createTranslateResult } from './components'

// 声明全局变量
let translateBtn: HTMLDivElement | null = null
let translateResult: HTMLDivElement | null = null

// 初始化翻译功能
function initializeComponents() {
  if (!translateBtn) {
    translateBtn = createTranslateButton()
  }
  if (!translateResult) {
    translateResult = createTranslateResult()
  }
}

// 处理翻译请求
async function handleTranslate(selectedText: string, rect: DOMRect) {
  try {
    if (!translateResult) return

    translateResult.style.display = 'block'
    translateResult.style.left = `${rect.right + window.scrollX}px`
    translateResult.style.top = `${rect.bottom + window.scrollY + 5}px`
    translateResult.textContent = '正在翻译...'
    
    // 添加淡入效果
    setTimeout(() => {
      if (translateResult) {
        translateResult.style.opacity = '1'
        translateResult.style.transform = 'translateY(0)'
      }
    }, 0)

    const response = await chrome.runtime.sendMessage({
      type: 'CHAT_MESSAGE',
      message: `请将以下文本翻译成中文：\n${selectedText}`
    })

    translateResult.textContent = response.data
  } catch (error) {
    console.error('翻译失败:', error)
    if (translateResult) {
      translateResult.textContent = '翻译失败，请重试'
    }
  }
}

// 监听文本选择事件
export function initializeTranslateEvents() {
  // 确保DOM加载完成后再初始化事件
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEvents)
  } else {
    initEvents()
  }
}

// 初始化事件监听器
function initEvents() {
  // 确保组件已初始化
  initializeComponents()

  document.addEventListener('mouseup', (e) => {
    if (!translateBtn || !translateResult) return
    
    // 防止在按钮或结果框上释放鼠标时触发
    if (e.target === translateBtn || e.target === translateResult) {
      return
    }

    const selection = window.getSelection()
    const selectedText = selection?.toString().trim()

    if (selectedText && selectedText.length > 0) {
      // 获取选中文本的位置
      const range = selection?.getRangeAt(0)
      const rect = range?.getBoundingClientRect()

      if (rect) {
        // 显示翻译按钮
        translateBtn.style.display = 'block'
        translateBtn.style.left = `${rect.right + window.scrollX}px`
        translateBtn.style.top = `${rect.top + window.scrollY}px`

        // 点击翻译按钮时发送翻译请求
        translateBtn.onclick = () => handleTranslate(selectedText, rect)
      }
    }
  })

  // 点击页面其他区域时隐藏翻译按钮和结果
  document.addEventListener('click', (e) => {
    if (!translateBtn || !translateResult) return

    // 如果正在选择文本，不触发隐藏逻辑
    const selection = window.getSelection()
    const selectedText = selection?.toString().trim()
    if (selectedText && selectedText.length > 0) return

    // 如果点击的不是翻译按钮或结果框，则隐藏它们
    if (!translateBtn.contains(e.target as Node) && !translateResult.contains(e.target as Node)) {
      // 仅在点击非翻译按钮区域时隐藏翻译按钮
      if (!translateBtn.contains(e.target as Node)) {
        translateBtn.style.display = 'none'
      }
      // 添加淡出效果
      translateResult.style.opacity = '0'
      translateResult.style.transform = 'translateY(8px)'
      setTimeout(() => {
        if (translateResult) {
          translateResult.style.display = 'none'
        }
      }, 200)
    }
  })
}