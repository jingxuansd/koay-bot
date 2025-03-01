import '../../public/writer.css'
import { renderWriterToolbar } from './components/WriterToolbarNative'

export const initializeWriter = async () => {
  // 检查写作助手是否启用
  const { writerEnabled } = await chrome.storage.local.get(['writerEnabled'])
  if (!writerEnabled) return

  let currentToolbar: (() => void) | null = null

  // 监听输入事件
  const handleInput = (event: Event) => {
    const target = event.target as HTMLElement
    const isInput = target.tagName === 'INPUT';
    const isTextarea = target.tagName === 'TEXTAREA';
    const isEditable = target.getAttribute('contenteditable') === 'true' || 
                     target.getAttribute('contentEditable') === 'inherit' || 
                     target.getAttribute('role') === 'textbox' || 
                     target.getAttribute('contenteditable') === 'plaintext-only' ||
                     target.getAttribute('contenteditable') === '' ||
                     target.classList.contains('editable') ||
                     target.isContentEditable;

    // 添加调试日志
    console.log('Element Type Check:', {
      tagName: target.tagName,
      isInput,
      isTextarea,
      isEditable,
      contentEditable: target.getAttribute('contenteditable'),
      role: target.getAttribute('role')
    });

    if (isInput || isTextarea || isEditable) {
      const selection = window.getSelection();
      console.log('Selection Object:', selection);
      if (!selection) return;

      if (selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      console.log('Range Object:', {
        range,
        startOffset: range?.startOffset,
        endOffset: range?.endOffset,
        selectedText: range?.toString()
      });
      if (!range) return;
      if (range.collapsed) return; // 确保有文本被选中

      const rect = range.getBoundingClientRect();
      console.log('Range Rectangle:', {
        rect,
        top: rect?.top,
        bottom: rect?.bottom,
        left: rect?.left,
        right: rect?.right
      });

      if (rect) {
        // 销毁已存在的工具栏
        if (currentToolbar) {
          currentToolbar();
        }

        const position = {
          top: rect.bottom + window.scrollY + 10, // 将工具栏显示在选中文本的下方
          left: rect.left + window.scrollX // 与选中文本左对齐
        };
        console.log('Toolbar Position:', {
          position,
          scrollY: window.scrollY,
          scrollX: window.scrollX
        });
        
        // 渲染新的工具栏并保存销毁函数
        currentToolbar = renderWriterToolbar(position);
      }
    }
  }

  // 添加事件监听器
  document.addEventListener('mouseup', handleInput) // 改为监听mouseup事件，以便在选中文本后显示工具栏
  document.addEventListener('keyup', handleInput) // 同时监听键盘事件，支持键盘选择文本
}