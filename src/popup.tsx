import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import '../public/popup.css'

interface Config {
  model: 'deepseek-r1' | 'chatgpt'
  apiKey: string
}

const Popup = () => {
  const [config, setConfig] = useState<Config>({
    model: 'deepseek-r1',
    apiKey: ''
  })

  useEffect(() => {
    // 从storage中加载配置
    chrome.storage.local.get(['model', 'apiKey'], (result) => {
      if (result.model && result.apiKey) {
        setConfig({
          model: result.model,
          apiKey: result.apiKey
        })
      }
    })
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // 保存配置到storage
    chrome.storage.local.set({
      model: config.model,
      apiKey: config.apiKey
    }, () => {
      alert('配置已保存')
    })
  }

  return (
    <div className="popup-container">
      <h1>Koay 配置</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>选择语言模型：</label>
          <select
            value={config.model}
            onChange={(e) => setConfig({ ...config, model: e.target.value as Config['model'] })}
          >
            <option value="deepseek-r1">DeepSeek-R1</option>
            <option value="chatgpt">ChatGPT</option>
          </select>
        </div>
        <div className="form-group">
          <label>API密钥：</label>
          <input
            type="password"
            value={config.apiKey}
            onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
            placeholder="请输入API密钥"
            required
          />
        </div>
        <button type="submit">保存配置</button>
      </form>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
)