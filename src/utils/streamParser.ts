/**
 * 解析流式数据块，提取实际的对话内容
 * @param decodedData 解码后的数据块
 * @returns 解析出的对话内容，如果解析失败或没有内容则返回null
 */
export function parseStreamData(decodedData: string): string | null {
  try {
    // 检查是否为[DONE]标记，提前返回
    if (decodedData.includes('[DONE]')) {
      console.log('接收到[DONE]标记，数据流结束')
      return null
    }

    // 将数据按照'data: '分割成多个块
    const dataBlocks = decodedData.split('data: ').filter(block => block.trim())
    let combinedContent = ''

    // 处理每个数据块
    for (const block of dataBlocks) {
      const jsonStr = block.trim()
      if (jsonStr) {
        try {
          // 尝试解析JSON数据
          const jsonData = JSON.parse(jsonStr)
          
          // 检查数据结构的完整性
          if (!jsonData.choices || !Array.isArray(jsonData.choices)) {
            console.warn('数据块格式不正确，缺少choices数组:', jsonStr)
            continue
          }

          const content = jsonData.choices[0]?.delta?.content
          if (content) {
            combinedContent += content
          }
        } catch (parseError) {
          // 提供更详细的错误信息
          console.warn('数据块解析失败:', {
            block: jsonStr,
            error: parseError instanceof Error ? parseError.message : '未知错误'
          })
          continue
        }
      }
    }

    return combinedContent || null
  } catch (error) {
    // 记录完整的错误信息
    console.error('解析数据流失败:', {
      input: decodedData,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : '未知错误'
    })
    return null
  }
}