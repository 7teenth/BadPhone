function App() {
  const ipcHandle = () => window.electron.ipcRenderer.send('ping');

  return (
    <>
      <div>
        <a target="_blank" rel="noreferrer" onClick={ipcHandle}>
          Send IPC
        </a>
      </div>
    </>
  );
}

export default App;
