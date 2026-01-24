const { app, BrowserWindow, Menu, dialog, shell, globalShortcut, ipcMain } = require("electron");
const path = require("path");
const http = require("http");
const handler = require("serve-handler");
const isDev = process.env.NODE_ENV === "development";
const { autoUpdater } = require("electron-updater");
const fs = require("fs");

let server = null;
let PORT = 3001;
let mainWindow;
let updateWindow = null;
const versionFile = path.join(app.getPath("userData"), "version.txt"); // для хранения предыдущей версии

// ------------------------- Создание главного окна -------------------------
async function createWindow() {
  const preloadPath = app.isPackaged
    ? path.join(process.resourcesPath, 'app.asar', 'electron', 'preload.js') // путь в сборке
    : path.join(__dirname, 'preload.js'); // путь в dev

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: true,
    autoHideMenuBar: true,
    icon: path.join(__dirname, "icon.png"),
    show: false,
    titleBarStyle: "default",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
      enableRemoteModule: false,
      webSecurity: true,
    },
  });

  mainWindow.maximize();

  let startUrl;
  if (isDev) {
    startUrl = "http://localhost:3000";
  } else {
    await startLocalServer();
    startUrl = `http://localhost:${PORT}`;
  }

  console.log('Preload path:', preloadPath); // для проверки пути

  mainWindow.loadURL(startUrl);

  mainWindow.once("ready-to-show", () => mainWindow.show());

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  globalShortcut.register("F12", () => {
    mainWindow.webContents.toggleDevTools({ mode: "detach" });
  });

  mainWindow.on("close", (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      const choice = dialog.showMessageBoxSync(mainWindow, {
        type: "question",
        buttons: ["Так", "Ні"],
        title: "Підтвердження закриття",
        message: "Ви дійсно хочете закрити додаток?",
        defaultId: 0,
        cancelId: 1,
      });
      if (choice === 0) {
        app.isQuiting = true;
        app.quit();
      }
    }
  });

  if (!isDev) {
    initAutoUpdater();
  }

  // Listen to updater commands from renderer
  ipcMain.on('updater:check', () => { try { autoUpdater.checkForUpdates(); } catch (e) { console.warn(e); } });
  ipcMain.on('updater:download', () => { try { autoUpdater.downloadUpdate(); } catch (e) { console.warn(e); } });
  ipcMain.on('updater:install', () => { try { autoUpdater.quitAndInstall(); } catch (e) { console.warn(e); } });
  ipcMain.on('updater:skip', () => { console.log('Renderer requested skip update'); });

  mainWindow.webContents.on("did-fail-load", (event, errorCode, errorDescription) => {
    console.error("Failed to load:", errorCode, errorDescription);
    if (!isDev) {
      dialog.showErrorBox(
        "Ошибка загрузки",
        `Не удалось загрузить приложение.\nКод ошибки: ${errorCode}\nОписание: ${errorDescription}`
      );
    }
  });

  showWhatsNewIfUpdated();
}


// ------------------------- Меню -------------------------
function createMenu() {
  const template = [
    {
      label: "Файл",
      submenu: [
        { label: "Обновить", accelerator: "F5", click: () => mainWindow.reload() },
        { label: "Принудительное обновление", accelerator: "Ctrl+F5", click: () => mainWindow.webContents.reloadIgnoringCache() },
        { type: "separator" },
        { label: "Выход", accelerator: process.platform === "darwin" ? "Cmd+Q" : "Ctrl+Q", click: () => { app.isQuiting = true; app.quit(); } },
      ],
    },
    {
      label: "Вид",
      submenu: [
        { label: "Полный экран", accelerator: "F11", click: () => mainWindow.setFullScreen(!mainWindow.isFullScreen()) },
        { label: "Инструменты разработчика", accelerator: "F12", click: () => mainWindow.webContents.toggleDevTools({ mode: "detach" }) },
      ],
    },
    {
      label: "Справка",
      submenu: [
        {
          label: "О программе",
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: "info",
              title: "О программе",
              message: "BadPhone POS",
              detail: `Версия: ${app.getVersion()}\nРазработчик: Nikita Karvatskyi\n\nСистема управления продажами`,
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// ------------------------- Локальный сервер -------------------------
function startLocalServer() {
  return new Promise((resolve, reject) => {
    if (server) return resolve();

    const staticPath = path.join(app.getAppPath(), "out");
    server = http.createServer((req, res) => handler(req, res, { public: staticPath, cleanUrls: true, trailingSlash: true }));

    server.listen(PORT, "localhost", (err) => {
      if (err) return reject(err);
      console.log(`Local server started on http://localhost:${PORT}`);
      resolve();
    });

    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        PORT++;
        startLocalServer().then(resolve).catch(reject);
      } else {
        reject(err);
      }
    });
  });
}

// ------------------------- Инициализация автообновления -------------------------
function initAutoUpdater() {
  autoUpdater.logger = require("electron-log");
  autoUpdater.logger.transports.file.level = "info";
  autoUpdater.checkForUpdatesAndNotify();

  // 1️⃣ Уведомление о доступном обновлении
  autoUpdater.on("update-available", (info) => {
    const choice = dialog.showMessageBoxSync(mainWindow, {
      type: "question",
      buttons: ["Да", "Нет"],
      title: "Доступно обновление",
      message: "Доступна новая версия приложения. Хотите скачать обновление сейчас?",
      defaultId: 0,
      cancelId: 1,
    });

    if (choice === 0) {
      openUpdateWindow(); // открываем окно прогресса
      autoUpdater.downloadUpdate();
    }

    // notify renderer UI
    try {
      if (mainWindow?.webContents) mainWindow.webContents.send('update-available', info || {});
    } catch (e) {}
  });

  // 2️⃣ Прогресс загрузки
  autoUpdater.on("download-progress", (progress) => {
    const percent = Math.round(progress.percent);
    if (updateWindow) {
      updateWindow.webContents.send("update-progress", percent);
    }
    mainWindow.setProgressBar(progress.percent / 100);
    try {
      if (mainWindow?.webContents) mainWindow.webContents.send('download-progress', progress);
    } catch (e) {}
  });

  // 3️⃣ После загрузки — установка
  autoUpdater.on("update-downloaded", (info) => {
    mainWindow.setProgressBar(-1);
    if (updateWindow) {
      updateWindow.close();
      updateWindow = null;
    }
    dialog.showMessageBox(mainWindow, {
      type: "info",
      buttons: ["OK"],
      title: "Обновление готово",
      message: "Обновление загружено. Приложение будет перезапущено для установки обновления.",
    }).then(() => autoUpdater.quitAndInstall());

    try {
      if (mainWindow?.webContents) mainWindow.webContents.send('update-downloaded', info || {});
    } catch (e) {}
  });

  autoUpdater.on("error", (err) => {
    console.error("Update error:", err);
    try {
      if (mainWindow?.webContents) mainWindow.webContents.send('update-error', { message: err?.message || String(err) });
    } catch (e) {}
  });
}

// ------------------------- Окно прогресса обновления -------------------------
function openUpdateWindow() {
  if (updateWindow) return;

  updateWindow = new BrowserWindow({
    width: 400,
    height: 150,
    parent: mainWindow,
    modal: true,
    frame: false,
    resizable: false,
    webPreferences: { contextIsolation: true, nodeIntegration: true },
  });

  updateWindow.loadURL(`data:text/html,
  <html>
    <head>
      <title>Updating...</title>
      <style>
        body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 0; height: 100%; }
        #progress { width: 80%; height: 25px; border: 1px solid #ccc; border-radius: 5px; margin-top: 20px; }
        #bar { height: 100%; width: 0%; background: #4caf50; border-radius: 5px; }
        #percent { margin-top: 10px; }
      </style>
    </head>
    <body>
      <h3>Загрузка обновления...</h3>
      <div id="progress"><div id="bar"></div></div>
      <div id="percent">0%</div>
      <script>
        const { ipcRenderer } = require('electron');
        ipcRenderer.on('update-progress', (event, percent) => {
          document.getElementById('bar').style.width = percent + '%';
          document.getElementById('percent').innerText = percent + '%';
        });
      </script>
    </body>
  </html>`);
}

// ------------------------- Окно "Что нового" -------------------------
function showWhatsNewIfUpdated() {
  const currentVersion = app.getVersion();
  let previousVersion = null;

  try {
    previousVersion = fs.readFileSync(versionFile, "utf-8");
  } catch (err) {
    // Файл не существует — первый запуск
  }

  if (previousVersion !== currentVersion) {
    fs.writeFileSync(versionFile, currentVersion); // сохраняем новую версию

    if (previousVersion !== null) { // показываем только если это не первый запуск
      dialog.showMessageBox(mainWindow, {
        type: "info",
        buttons: ["OK"],
        title: `What's New in v${currentVersion}`,
        message: `Привет! У вас новая версия: v${currentVersion}`,
        detail:
`• Fixed work shift bug`
      });
    }
  }
}

// ------------------------- App events -------------------------
app.whenReady().then(() => {
  createWindow();
  createMenu();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (server) { server.close(); server = null; }
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (server) { server.close(); server = null; }
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  dialog.showErrorBox("Критическая ошибка", error.message);
});
