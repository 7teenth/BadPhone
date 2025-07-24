const { app, BrowserWindow } = require('electron');
const { exec } = require('child_process');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      contextIsolation: true,
    },
  });

  mainWindow.loadURL('http://localhost:3000'); // Next.js сервер
}

app.whenReady().then(() => {
  // запускаем сервер next start
  exec('npx next start', (err, stdout, stderr) => {
    if (err) {
      console.error('Ошибка запуска next start:', err);
      return;
    }
    console.log(stdout);
    createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
