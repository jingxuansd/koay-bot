import '../../../public/writer.css'

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
    this.container.appendChild(buttonsContainer)
    console.log('工具栏已创建完成，准备挂载到DOM')

    // 添加事件监听
    document.addEventListener('click', this.handleClickOutside)
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
    if (buttonId === 'koay-writer-continue') {
      console.log('续写功能被点击')
    } else if (buttonId === 'koay-writer-collaborate') {
      console.log('分类协作功能被点击')
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
    document.removeEventListener('click', this.handleClickOutside)
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container)
    }
  }
}

export const renderWriterToolbar = (position: Position) => {
  const toolbar = new WriterToolbarNative(position)
  toolbar.mount()
  return () => toolbar.destroy()
}