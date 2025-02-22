import { initializeTranslateEvents } from './translate/translate'
import { initializeFullPageTranslate } from './translate/fullPageTranslate'
import { initializeSummary } from './translate/summary'
import { createBot } from './bot/bot'
import '../public/summary.css'

// 初始化聊天机器人
createBot()

// 初始化翻译功能
initializeTranslateEvents()

// 初始化全文翻译
initializeFullPageTranslate()

// 初始化总结功能
initializeSummary()
