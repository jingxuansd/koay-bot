export const getOptimizePrompt = (text: string) => {
  return `你是一个专业的文字优化助手。请帮我优化以下文字，使其更加专业、准确和易读，同时保持原文的核心意思：

${text}

请直接返回优化后的文字，不需要解释修改原因。`
}