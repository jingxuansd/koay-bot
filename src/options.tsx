import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import '../public/options.css'

const Options = () => {
  const [model, setModel] = useState('deepseek-r1')
  const [apiKey, setApiKey] = useState('')
  const [writerEnabled, setWriterEnabled] = useState(false)

  useEffect(() => {
    // 加载已保存的配置
    chrome.storage.local.get(['model', 'apiKey', 'writerEnabled']).then((config) => {
      if (config.model) setModel(config.model)
      if (config.apiKey) setApiKey(config.apiKey)
      if (config.writerEnabled !== undefined) setWriterEnabled(config.writerEnabled)
    })
  }, [])

  const handleSave = async () => {
    await chrome.storage.local.set({
      model,
      apiKey,
      writerEnabled
    })
    alert('保存成功！')
  }

  return (
    <div className="popup-container">
      <h1>Koay 设置</h1>
      <form>
        <div className="form-group">
          <label>选择语言模型：</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            <option value="deepseek-r1">DeepSeek-R1</option>
            <option value="chatgpt">ChatGPT</option>
          </select>
        </div>
        <div className="form-group">
          <label>API密钥：</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="请输入API密钥"
          />
        </div>
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={writerEnabled}
              onChange={(e) => setWriterEnabled(e.target.checked)}
            />
            启用写作助手
          </label>
        </div>
        <button type="button" onClick={handleSave}>保存</button>
      </form>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Options />
  </React.StrictMode>
)