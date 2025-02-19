import { marked } from 'marked'

interface ConnectionManagerOptions {
  onData?: (data: string) => void
  onError?: (error: string) => void
  onEnd?: () => void
}

class ConnectionManager {
  private port: chrome.runtime.Port | null = null
  private fullContent = ''
  private readonly options: ConnectionManagerOptions
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null

  constructor(options: ConnectionManagerOptions = {}) {
    this.options = options
  }

  connect() {
    try {
      // 确保在重新连接前清理旧的连接
      if (this.port) {
        this.disconnect()
      }

      // 检查runtime状态
      if (!chrome.runtime) {
        throw new Error('Chrome runtime 未就绪')
      }

      this.port = chrome.runtime.connect({ name: 'chat' });
      
      // 检查连接是否成功创建
      if (!this.port) {
        throw new Error('端口创建失败')
      }

      this.setupListeners()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      console.error('连接创建详细错误:', error)
      this.handleError(`连接创建失败: ${errorMessage}`)
    }
  }

  private setupListeners() {
    if (!this.port) return

    this.port.onDisconnect.addListener(() => {
      if (chrome.runtime.lastError) {
        console.error('端口连接断开:', chrome.runtime.lastError)
      }
    })

    this.port.onMessage.addListener((msg) => {
      if (msg.type === 'STREAM_DATA') {
        this.handleStreamData(msg.data)
      } else if (msg.type === 'STREAM_ERROR') {
        this.handleError(msg.error)
      } else if (msg.type === 'STREAM_END') {
        this.handleStreamEnd()
      }
    })
  }

  private handleStreamData(data: string) {
    this.fullContent += data
    if (this.options.onData) {
      try {
        const markdownContent = marked.parse(this.fullContent) as string
        this.options.onData(markdownContent)
      } catch (error) {
        console.error('Markdown渲染失败:', error)
        this.options.onData(this.fullContent)
      }
    }
  }

  private handleError(error: string) {
    if (this.options.onError) {
      this.options.onError(error)
    }
    this.disconnect()
  }

  private handleStreamEnd() {
    if (this.options.onEnd) {
      this.options.onEnd()
    }
    this.disconnect()
  }

  disconnect() {
    try {
      // 先释放reader资源
      if (this.reader) {
        this.reader.cancel().catch(error => {
          console.error('取消reader失败:', error)
        })
        this.reader.releaseLock()
        this.reader = null
      }

      // 断开端口连接
      if (this.port) {
        this.port.disconnect()
        this.port = null
      }
    } catch (error) {
      console.error('断开连接时发生错误:', error)
    }
  }

  isConnected(): boolean {
    return this.port !== null
  }

  reset() {
    this.fullContent = ''
  }

  sendMessage(message: unknown) {
    if (!this.port) {
      throw new Error('未建立连接')
    }
    this.port.postMessage(message)
  }
}

export default ConnectionManager