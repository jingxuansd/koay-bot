export const deepseek = {
  async chat(message: string, apiKey: string, model: string = 'deepseek-chat'): Promise<ReadableStream> {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [{
          role: 'user',
          content: message
        }],
        stream: true
      })
    })

    if (!response.ok) {
      throw new Error('API请求失败')
    }

    const stream = response.body
    if (!stream) {
      throw new Error('返回的数据流为空')
    }

    return stream
  },

  async chatNonStream(message: string, apiKey: string, model: string = 'deepseek-chat'): Promise<string> {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [{
          role: 'user',
          content: message
        }],
        stream: false
      })
    })

    if (!response.ok) {
      throw new Error('API请求失败')
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || ''
  }
}