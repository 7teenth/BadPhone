const { app, BrowserWindow } = require('electron');

let mainWindow;

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true, // Для использования Node.js внутри приложения
        },
    });

    // Загрузка локального HTML-файла или URL
    mainWindow.loadFile('index.html'); // Если у вас есть локальный файл
    // mainWindow.loadURL('https://example.com'); // Или укажите URL сайта
});

