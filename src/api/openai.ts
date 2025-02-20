export const openai = {
  async chat(message: string, apiKey: string): Promise<ReadableStream> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
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

  async chatNonStream(message: string, apiKey: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
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