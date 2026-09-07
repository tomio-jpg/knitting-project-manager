import './App.css'

function App() {
  return (
    <main className="welcome-screen">
      <div className="welcome-card">
        <span className="welcome-icon" aria-hidden="true">🧶</span>
        <p className="eyebrow">個人用 編み物制作管理</p>
        <h1>編みもの記録</h1>
        <p className="message">
          アプリの土台を準備中です。<br />
          次の段階から、作品の記録機能を作っていきます。
        </p>
        <p className="status" role="status">PWAとして利用できます</p>
      </div>
    </main>
  )
}

export default App
