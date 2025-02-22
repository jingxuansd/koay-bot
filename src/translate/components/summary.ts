// 创建总结按钮
export function createSummaryButton() {
  const button = document.createElement('div')
  button.className = 'koay-summary-btn'
  button.innerHTML = '总结全文'
  button.style.cssText = `
    position: absolute;
    display: none;
    padding: 6px 12px;
    background: linear-gradient(135deg, #4a90e2, #357abd);
    color: white;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    z-index: 10000;
    box-shadow: 0 2px 8px rgba(74, 144, 226, 0.3);
    transition: all 0.3s ease;
    user-select: none;
    opacity: 0;
    transform: scale(0.95);
  `

  // 添加悬浮效果
  button.addEventListener('mouseover', () => {
    button.style.transform = 'translateY(-1px)'
    button.style.boxShadow = '0 4px 12px rgba(74, 144, 226, 0.4)'
  })

  button.addEventListener('mouseout', () => {
    button.style.transform = 'translateY(0)'
    button.style.boxShadow = '0 2px 8px rgba(74, 144, 226, 0.3)'
  })

  document.body.appendChild(button)
  return button
}

// 创建总结结果容器
export function createSummaryContainer() {
  const container = document.createElement('div')
  container.className = 'koay-summary-container'
  container.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    width: 320px;
    max-height: 85vh;
    overflow-y: auto;
    padding: 12px;
    background: white;
    color: #2c3e50;
    z-index: 10000;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    opacity: 0;
    transform: translateX(30px);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  `

  // 添加滚动条样式
  container.innerHTML = `
    <style>
      .koay-summary-container::-webkit-scrollbar {
        width: 4px;
      }
      .koay-summary-container::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 2px;
      }
      .koay-summary-container::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 2px;
      }
      .koay-summary-container::-webkit-scrollbar-thumb:hover {
        background: #555;
      }
    </style>
  `

  // 创建内容容器
  const contentContainer = document.createElement('div')
  contentContainer.className = 'koay-summary-content'
  container.appendChild(contentContainer)

  // 监听内容变化，自动滚动到底部
  const observer = new MutationObserver(() => {
    container.scrollTop = container.scrollHeight
  })

  observer.observe(contentContainer, {
    childList: true,
    subtree: true,
    characterData: true
  })

  document.body.appendChild(container)
  return container
}