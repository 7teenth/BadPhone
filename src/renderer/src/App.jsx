function App() {
  const ipcHandle = () => window.electron.ipcRenderer.send('ping');

  return (
    <>
      <div>
        <button onClick={ipcHandle}>Send IPC</button>
      </div>
    </>
  );
}

export default App;
