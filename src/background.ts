import { handleChatMessage } from './server/messageHandler'

// 监听扩展程序安装事件
chrome.runtime.onInstalled.addListener(() => {
  // 创建右键菜单
  chrome.contextMenus.create({
    id: 'koay-translate-full-page',
    title: 'koay 翻译全文',
    contexts: ['page']
  })
})

// 监听右键菜单点击事件
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'koay-translate-full-page' && tab?.id) {
    // 向content script发送开始翻译的消息
    chrome.tabs.sendMessage(tab.id, { type: 'START_FULL_PAGE_TRANSLATE' })
  }
})


// 处理来自content script的消息
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === 'OPEN_OPTIONS_PAGE') {
    chrome.runtime.openOptionsPage()
    sendResponse({ success: true })
    return true
  }
})

// 监听连接请求
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'koay') {
    port.onMessage.addListener(async (request) => {
      if (request.type === 'CHAT') {
        handleChatMessage(request.data, request.reasonMode, port)
      } else if (request.type === 'TRANSLATE') {
        handleChatMessage(request.data, request.reasonMode, port)
      } else if (request.type === 'SUMMARY') {
        handleChatMessage(request.data, request.reasonMode, port)
      } else if (request.type === 'OPTIMIZE_TEXT') {
        handleChatMessage(request.data, request.reasonMode, port)
      }
    })
    port.onDisconnect.addListener(() => {
      console.log('连接已断开')
    })
  }
})