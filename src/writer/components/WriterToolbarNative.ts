import '../../../public/writer.css'
import { OptimizeDialog } from './OptimizeDialog'
import ConnectionManager from '../../client/connectionManager'
import { getOptimizePrompt } from '../../prompts/optimizePrompt'
interface Position {
  top: number
  left: number
}

export class WriterToolbarNative {
  private container: HTMLDivElement
  private position: Position

  constructor(position: Position) {
    this.position = position
    this.container = document.createElement('div')
    this.initialize()
  }

  private initialize() {
    this.container.className = 'koay-writer-toolbar'
    this.container.style.position = 'fixed'
    this.container.style.top = `${this.position.top}px`
    this.container.style.left = `${this.position.left}px`
    this.container.style.opacity = '1'
    this.container.style.transform = 'translateX(0)'
    this.container.style.pointerEvents = 'none' // 临时禁用点击事件

    const buttonsContainer = document.createElement('div')
    buttonsContainer.className = 'koay-writer-buttons'

    // 创建优化按钮
    const optimizeButton = this.createButton('', 'koay-writer-optimize')
    const optimizeIcon = document.createElement('img')
    optimizeIcon.src = chrome.runtime.getURL('icons/optimize.png')
    optimizeButton.title = '优化'
    optimizeButton.appendChild(optimizeIcon)
    optimizeButton.insertBefore(optimizeIcon, optimizeButton.firstChild)
    console.log('优化按钮已创建:', optimizeButton)

    buttonsContainer.appendChild(optimizeButton)

    // 创建续写按钮
    const continueButton = this.createButton('', 'koay-writer-continue')
    const continueIcon = document.createElement('img')
    continueIcon.src = chrome.runtime.getURL('icons/continue.png')
    continueButton.title = '续写'
    continueButton.appendChild(continueIcon)
    continueButton.insertBefore(continueIcon, continueButton.firstChild)
    console.log('续写按钮已创建:', continueButton)

    buttonsContainer.appendChild(continueButton)

    // 创建更多按钮
    const moreOptionsButton = this.createButton('', 'koay-writer-moreoptions')
    const moreOptionsIcon = document.createElement('img')
    moreOptionsIcon.src = chrome.runtime.getURL('icons/moreOptions.png')
    moreOptionsButton.title = '更多选项'
    moreOptionsButton.appendChild(moreOptionsIcon)
    moreOptionsButton.insertBefore(moreOptionsIcon, moreOptionsButton.firstChild)
    console.log('更多选项按钮已创建:', moreOptionsButton)

    buttonsContainer.appendChild(moreOptionsButton)

    // 创建配置按钮
    const settingsButton = this.createButton('', 'koay-writer-settings')
    const settingsIcon = document.createElement('img')
    settingsIcon.src = chrome.runtime.getURL('icons/settings.png')
    settingsButton.title = '配置'
    settingsButton.appendChild(settingsIcon)
    settingsButton.insertBefore(settingsIcon, settingsButton.firstChild)
    console.log('配置按钮已创建:', settingsButton)

    buttonsContainer.appendChild(settingsButton)
    this.container.appendChild(buttonsContainer)
    console.log('工具栏已创建完成，准备挂载到DOM')

    // 添加事件监听
    // 使用setTimeout延迟添加点击事件监听器，避免与创建时的mouseup事件冲突
    setTimeout(() => {
      this.container.style.pointerEvents = 'auto' // 恢复点击事件
      document.addEventListener('click', this.handleClickOutside)
    }, 100)
  }

  private createButton(text: string, id: string): HTMLButtonElement {
    const button = document.createElement('button')
    button.className = 'koay-writer-button'
    button.id = id

    const span = document.createElement('span')
    span.textContent = text
    button.appendChild(span)

    button.addEventListener('click', (e) => this.handleButtonClick(e, id))
    button.addEventListener('mouseenter', () => this.handleMouseEnter(id))
    button.addEventListener('mouseleave', () => this.handleMouseLeave())

    return button
  }

  private handleButtonClick(event: MouseEvent, buttonId: string) {
    event.stopPropagation()
    if (buttonId === 'koay-writer-optimize') {
      const selection = window.getSelection()
      if (!selection) return
      
      const selectedText = selection.toString().trim()
      if (!selectedText) return

      const dialog = new OptimizeDialog({
        originalText: selectedText,
        optimizedText: '优化中...',
        onReplace: () => {
          const range = selection.getRangeAt(0)
          range.deleteContents()
          range.insertNode(document.createTextNode(dialog.getOptimizedText()))
          this.destroy()
        },
        onInsert: () => {
          const range = selection.getRangeAt(0)
          const endRange = range.cloneRange()
          endRange.collapse(false)
          endRange.insertNode(document.createTextNode(dialog.getOptimizedText()))
          this.destroy()
        },
        onClose: () => {
          this.destroy()
        }
      })
      
      // 先挂载对话框
      dialog.mount()
      console.log('WriterToolbarNative: 对话框已挂载')
      
      // 然后初始化连接管理器
      const connectionManager = new ConnectionManager(
        {
          onData: (data) => {
            console.log('WriterToolbarNative: 收到数据，准备更新对话框', data)
            dialog.updateOptimizedText(data.content)
          },
          onError: (error) => {
            console.error('WriterToolbarNative: 收到错误', error)
          },
          onEnd: () => {
            console.log('WriterToolbarNative: 数据流结束')
          }
        }
      )
      
      // 最后建立连接并发送请求
      console.log('WriterToolbarNative: 准备建立连接')
      connectionManager.connect()
      
      console.log('WriterToolbarNative: 准备发送优化请求')
      connectionManager.send({
        type: 'OPTIMIZE_TEXT',
        data: getOptimizePrompt(selectedText),
        reasonMode: false
      })
    } else if (buttonId === 'koay-writer-continue') {
      console.log('续写功能被点击')
    } else if (buttonId === 'koay-writer-settings') {
      chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS_PAGE' })
      this.destroy()
    }
  }

  private handleMouseEnter(buttonId: string) {
    const dropdown = this.container.querySelector(`#${buttonId} .koay-writer-dropdown`)
    if (dropdown) {
      dropdown.classList.add('show')
    }
  }

  private handleMouseLeave() {
    const dropdowns = this.container.querySelectorAll('.koay-writer-dropdown')
    dropdowns.forEach(dropdown => dropdown.classList.remove('show'))
  }

  private handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement
    if (!this.container.contains(target)) {
      this.destroy()
    }
  }

  public mount() {
    console.log('开始挂载工具栏，位置信息:', {
      top: this.position.top,
      left: this.position.left
    });
    document.body.appendChild(this.container);
    // 强制重新计算样式
    this.container.style.display = 'inline-flex';
    this.container.style.opacity = '1';
    this.container.style.visibility = 'visible';
    console.log('工具栏已挂载到DOM，当前样式:', {
      display: window.getComputedStyle(this.container).display,
      opacity: window.getComputedStyle(this.container).opacity,
      visibility: window.getComputedStyle(this.container).visibility,
      zIndex: window.getComputedStyle(this.container).zIndex
    });
  }

  public destroy() {
    console.log('开始销毁工具栏');
    document.removeEventListener('click', this.handleClickOutside)
    console.log('已移除点击事件监听器');
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container)
      console.log('已从DOM中移除工具栏元素');
    } else {
      console.log('工具栏元素已不在DOM中');
    }
    console.log('工具栏销毁完成');
  }
}

export const renderWriterToolbar = (position: Position) => {
  const toolbar = new WriterToolbarNative(position)
  toolbar.mount()
  return () => toolbar.destroy()
}