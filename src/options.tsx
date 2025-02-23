import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

const Options = () => {
  const [model, setModel] = useState('deepseek-r1')
  const [apiKey, setApiKey] = useState('')

  useEffect(() => {
    // 加载已保存的配置
    chrome.storage.local.get(['model', 'apiKey']).then((config) => {
      if (config.model) setModel(config.model)
      if (config.apiKey) setApiKey(config.apiKey)
    })
  }, [])

  const handleSave = async () => {
    await chrome.storage.local.set({
      model,
      apiKey
    })
    alert('保存成功！')
  }

  return (
    <div className="options-container" style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: '20px'
    }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Koay 设置</h1>
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '10px' }}>选择语言模型：</label>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ddd'
          }}
        >
          <option value="deepseek-r1">DeepSeek-R1</option>
          <option value="chatgpt">ChatGPT</option>
        </select>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '10px' }}>API密钥：</label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ddd'
          }}
          placeholder="请输入API密钥"
        />
      </div>
      <button
        onClick={handleSave}
        style={{
          width: '100%',
          padding: '10px',
          backgroundColor: '#4a90e2',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        保存
      </button>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Options />
  </React.StrictMode>
)