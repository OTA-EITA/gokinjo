import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// 開発環境ではStrictModeを使用、本番環境では無効化
const isDevelopment = import.meta.env.DEV;

ReactDOM.createRoot(document.getElementById('root')!).render(
  isDevelopment ? (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  ) : (
    <App />
  )
)
