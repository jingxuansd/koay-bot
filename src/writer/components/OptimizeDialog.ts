import '../../../public/writer.css'
import '../../../public/optimize.css'
import { marked } from 'marked'

interface OptimizeDialogProps {
  originalText: string
  optimizedText: string
  onReplace: () => void
  onInsert: () => void
  onClose: () => void
}

export class OptimizeDialog {
  private container: HTMLDivElement
  private props: OptimizeDialogProps
  private optimizedText: string = ''

  constructor(props: OptimizeDialogProps) {
    console.log('OptimizeDialog: 初始化对话框组件', { originalText: props.originalText })
    this.props = props
    this.optimizedText = props.optimizedText
    this.container = document.createElement('div')
    this.initialize()
  }

  public async updateOptimizedText(text: string) {
    console.log('OptimizeDialog: 更新优化后的文本', { text })
    const optimizedTextElement = this.container.querySelector('.koay-optimize-section:last-child .koay-optimize-text')
    if (optimizedTextElement) {
      const parsedText = await marked.parse(text)
      optimizedTextElement.innerHTML = parsedText
      this.optimizedText = parsedText
      console.log('OptimizeDialog: Markdown 文本已解析并更新')
    } else {
      console.warn('OptimizeDialog: 未找到优化后文本元素')
    }
  }

  public getOptimizedText(): string {
    console.log('OptimizeDialog: 获取优化后的文本', { text: this.optimizedText })
    // 移除Markdown标记，转换为纯文本
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = this.optimizedText
    const plainText = tempDiv.textContent || tempDiv.innerText || ''
    return plainText
  }

  private initialize() {
    console.log('OptimizeDialog: 开始初始化 DOM 结构')
    this.container.className = 'koay-optimize-dialog'
    this.container.innerHTML = `
      <div class="koay-optimize-content">
        <div class="koay-optimize-section">
          <h3>原始文本</h3>
          <div class="koay-optimize-text">${this.props.originalText}</div>
        </div>
        <div class="koay-optimize-divider"></div>
        <div class="koay-optimize-section">
          <h3>优化后文本</h3>
          <div class="koay-optimize-text">${this.props.optimizedText ? marked.parse(this.props.optimizedText) : ''}</div>
          <div class="koay-optimize-actions">
            <button class="koay-optimize-button" id="koay-optimize-replace">替换</button>
            <button class="koay-optimize-button" id="koay-optimize-insert">插入</button>
          </div>
        </div>
      </div>
    `

    // 添加事件监听
    const replaceButton = this.container.querySelector('#koay-optimize-replace')
    const insertButton = this.container.querySelector('#koay-optimize-insert')

    if (!replaceButton || !insertButton) {
      console.error('OptimizeDialog: 未找到操作按钮')
      return
    }

    console.log('OptimizeDialog: 添加按钮事件监听')
    replaceButton.addEventListener('click', () => {
      console.log('OptimizeDialog: 点击替换按钮')
      this.props.onReplace()
      this.destroy()
    })

    insertButton.addEventListener('click', () => {
      console.log('OptimizeDialog: 点击插入按钮')
      this.props.onInsert()
      this.destroy()
    })
    console.log('OptimizeDialog: DOM 结构初始化完成')
  }

  public mount() {
    console.log('OptimizeDialog: 开始挂载对话框')
    document.body.appendChild(this.container)
    // 强制重新计算样式并确保可见性
    requestAnimationFrame(() => {
      this.container.style.opacity = '1'
      this.container.style.visibility = 'visible'
    })
  
    // 延迟添加点击外部关闭事件监听，避免与创建时的点击事件冲突
    setTimeout(() => {
      console.log('OptimizeDialog: 添加点击外部关闭事件监听')
      this.container.addEventListener('click', (event) => {
        if (event.target === this.container) {
          console.log('OptimizeDialog: 检测到点击外部区域，准备关闭对话框')
          this.destroy()
        }
      })
    }, 100)
  }

  private destroy() {
    console.log('OptimizeDialog: 开始销毁对话框')
    this.props.onClose()
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container)
      console.log('OptimizeDialog: 对话框已从 DOM 中移除')
    } else {
      console.warn('OptimizeDialog: 对话框元素已不在 DOM 中')
    }
  }
}