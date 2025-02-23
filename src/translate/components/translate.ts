// 创建翻译按钮
export function createTranslateButton() {
  const button = document.createElement('button')
  button.className = 'koay-translate-btn'
  button.innerHTML = '翻译'
  button.style.cssText = `
    position: absolute;
    display: none;
    padding: 8px 16px;
    background: linear-gradient(135deg, #4a90e2, #357abd);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    z-index: 10000;
    box-shadow: 0 2px 8px rgba(74, 144, 226, 0.3);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    user-select: none;
    outline: none;
  `
  button.addEventListener('mouseover', () => {
    button.style.transform = 'translateY(-2px)';
    button.style.boxShadow = '0 6px 16px rgba(74, 144, 226, 0.4)';
    button.style.background = 'linear-gradient(135deg, #5a9ee8, #4084d0)';
  })
  button.addEventListener('mouseout', () => {
    button.style.transform = 'translateY(0)';
    button.style.boxShadow = '0 2px 8px rgba(74, 144, 226, 0.3)';
    button.style.background = 'linear-gradient(135deg, #4a90e2, #357abd)';
  })
  document.body.appendChild(button)
  return button
}

// 创建翻译结果窗口
export function createTranslateResult() {
  const result = document.createElement('div')
  result.className = 'koay-translate-result'
  result.style.cssText = `
    position: absolute;
    display: none;
    padding: 12px 16px;
    background: white;
    border-radius: 8px;
    max-width: 400px;
    min-width: 200px;
    font-size: 14px;
    line-height: 1.6;
    color: #333;
    z-index: 10000;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    transition: opacity 0.2s ease, transform 0.2s ease;
    opacity: 0;
    transform: translateY(8px);
  `
  document.body.appendChild(result)
  return result
}