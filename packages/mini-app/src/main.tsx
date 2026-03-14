import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/telegram.css';

window.addEventListener('error', (e) => {
  document.getElementById('root')!.innerHTML =
    `<pre style="color:red;padding:16px;font-size:12px;word-break:break-all;">ERROR: ${e.message}\n\n${e.filename}:${e.lineno}\n\n${e.error?.stack || ''}</pre>`;
});
window.addEventListener('unhandledrejection', (e) => {
  document.getElementById('root')!.innerHTML =
    `<pre style="color:red;padding:16px;font-size:12px;word-break:break-all;">PROMISE ERROR: ${e.reason?.message || e.reason}\n\n${e.reason?.stack || ''}</pre>`;
});

try {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
} catch (e: any) {
  document.getElementById('root')!.innerHTML =
    `<pre style="color:red;padding:16px;font-size:12px;word-break:break-all;">INIT ERROR: ${e.message}\n\n${e.stack}</pre>`;
}
