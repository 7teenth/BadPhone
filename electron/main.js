const { app, BrowserWindow, Menu, dialog, shell, globalShortcut } = require("electron");
const path = require("path");
const http = require("http");
const handler = require("serve-handler");
const isDev = process.env.NODE_ENV === "development";
const { autoUpdater } = require("electron-updater");

let server = null;
let PORT = 3001;
let mainWindow;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: true,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
    },
    icon: path.join(__dirname, "icon.png"),
    show: false,
    titleBarStyle: "default",
  });

  mainWindow.maximize();

  let startUrl;
  if (isDev) {
    startUrl = "http://localhost:3000";
  } else {
    await startLocalServer();
    startUrl = `http://localhost:${PORT}`;
  }

  mainWindow.loadURL(startUrl);

  mainWindow.once("ready-to-show", () => mainWindow.show());

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  // DevTools для prod через F12
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

  mainWindow.webContents.on("did-fail-load", (event, errorCode, errorDescription) => {
    console.error("Failed to load:", errorCode, errorDescription);
    if (!isDev) {
      dialog.showErrorBox(
        "Ошибка загрузки",
        `Не удалось загрузить приложение.\nКод ошибки: ${errorCode}\nОписание: ${errorDescription}`
      );
    }
  });
}

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

function initAutoUpdater() {
  autoUpdater.logger = require("electron-log");
  autoUpdater.logger.transports.file.level = "info";
  autoUpdater.checkForUpdatesAndNotify();

  autoUpdater.on("update-available", () => {
    dialog.showMessageBox(mainWindow, { type: "info", message: "Доступно обновление. Оно будет загружено автоматически." });
  });

  autoUpdater.on("update-downloaded", () => {
    dialog.showMessageBox(mainWindow, { type: "info", message: "Обновление загружено. Приложение будет перезапущено для установки обновления." })
      .then(() => autoUpdater.quitAndInstall());
  });

  autoUpdater.on("error", (err) => console.error("Update error:", err));
}

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
