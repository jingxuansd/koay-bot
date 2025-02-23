// 创建总结按钮
export function createSummaryButton() {
  const button = document.createElement('button')
  button.className = 'koay-summary-btn'
  button.innerHTML = '总结全文'
  button.style.cssText = `
    position: absolute;
    display: none;
    padding: 6px 12px;
    background: linear-gradient(135deg, #4a90e2, #357abd);
    color: white;
    border: none;
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
    outline: none;
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