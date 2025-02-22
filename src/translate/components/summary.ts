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
    transition: all 0.2s ease;
    user-select: none;
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
    top: 20px;
    right: 20px;
    width: 320px;
    max-height: 80vh;
    overflow-y: auto;
    padding: 16px;
    background: white;
    border-radius: 8px;
    font-size: 14px;
    line-height: 1.6;
    color: #333;
    z-index: 10000;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    opacity: 0;
    transform: translateX(20px);
  `

  // 添加滚动条样式
  container.innerHTML = `
    <style>
      .koay-summary-container::-webkit-scrollbar {
        width: 6px;
      }
      .koay-summary-container::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 3px;
      }
      .koay-summary-container::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 3px;
      }
      .koay-summary-container::-webkit-scrollbar-thumb:hover {
        background: #555;
      }
    </style>
  `

  document.body.appendChild(container)
  return container
}