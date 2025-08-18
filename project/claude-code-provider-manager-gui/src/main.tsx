import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// 防止右键菜单（可选）
document.addEventListener('contextmenu', e => e.preventDefault());

// 防止 F5 刷新（可选）
document.addEventListener('keydown', e => {
  if (e.key === 'F5') {
    e.preventDefault();
  }
});

// 防止拖拽（可选）
document.addEventListener('dragover', e => e.preventDefault());
document.addEventListener('drop', e => e.preventDefault());

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);