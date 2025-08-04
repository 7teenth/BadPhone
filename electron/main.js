const { app, BrowserWindow, Menu, dialog, shell } = require("electron");
const path = require("path");
const http = require("http");
const handler = require("serve-handler");

const isDev = process.env.NODE_ENV === "development";

let server = null;
let PORT = 3001;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    fullscreen: false,          // ❌ не fullscreen
  frame: true,                // ✅ оставить верхнюю панель окна с кнопками
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

  if (isDev) {
    mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.openDevTools();
  } else {
    startLocalServer()
      .then(() => {
        mainWindow.loadURL(`http://localhost:${PORT}`);
      })
      .catch((err) => {
        console.error("Failed to start local server:", err);
        dialog.showErrorBox("Ошибка", "Не удалось запустить локальный сервер");
      });
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();

    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
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

  mainWindow.webContents.on("did-fail-load", (event, errorCode, errorDescription) => {
    console.error("Failed to load:", errorCode, errorDescription);

    if (!isDev) {
      dialog.showErrorBox(
        "Ошибка загрузки",
        `Не удалось загрузить приложение.\nКод ошибки: ${errorCode}\nОписание: ${errorDescription}`
      );
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

function createMenu() {
  const template = [
    {
      label: "Файл",
      submenu: [
        {
          label: "Обновить",
          accelerator: "F5",
          click: () => {
            mainWindow.reload();
          },
        },
        {
          label: "Принудительное обновление",
          accelerator: "Ctrl+F5",
          click: () => {
            mainWindow.webContents.reloadIgnoringCache();
          },
        },
        { type: "separator" },
        {
          label: "Выход",
          accelerator: process.platform === "darwin" ? "Cmd+Q" : "Ctrl+Q",
          click: () => {
            app.isQuiting = true;
            app.quit();
          },
        },
      ],
    },
    {
      label: "Вид",
      submenu: [
        {
          label: "Увеличить",
          accelerator: "Ctrl+Plus",
          click: () => {
            const currentZoom = mainWindow.webContents.getZoomLevel();
            mainWindow.webContents.setZoomLevel(currentZoom + 0.5);
          },
        },
        {
          label: "Уменьшить",
          accelerator: "Ctrl+-",
          click: () => {
            const currentZoom = mainWindow.webContents.getZoomLevel();
            mainWindow.webContents.setZoomLevel(currentZoom - 0.5);
          },
        },
        {
          label: "Сбросить масштаб",
          accelerator: "Ctrl+0",
          click: () => {
            mainWindow.webContents.setZoomLevel(0);
          },
        },
        { type: "separator" },
        {
          label: "Полный экран",
          accelerator: "F11",
          click: () => {
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
          },
        },
        { type: "separator" },
        {
          label: "Инструменты разработчика",
          accelerator: "F12",
          click: () => {
            mainWindow.webContents.toggleDevTools();
          },
        },
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
    if (server) {
      resolve();
      return;
    }

    const staticPath = path.join(app.getAppPath(), "out");
    console.log("Starting server for:", staticPath);

    server = http.createServer((req, res) => {
      return handler(req, res, {
        public: staticPath,
        cleanUrls: true,
        trailingSlash: true,
      });
    });

    server.listen(PORT, "localhost", (err) => {
      if (err) {
        reject(err);
      } else {
        console.log(`Local server started on http://localhost:${PORT}`);
        resolve();
      }
    });

    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.log(`Port ${PORT} is busy, trying ${PORT + 1}`);
        PORT++;
        startLocalServer().then(resolve).catch(reject);
      } else {
        reject(err);
      }
    });
  });
}

app.whenReady().then(() => {
  createWindow();
  createMenu();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (server) {
    server.close();
    server = null;
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  if (server) {
    server.close();
    server = null;
  }
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  dialog.showErrorBox("Критическая ошибка", error.message);
});

app.on("certificate-error", (event, webContents, url, error, certificate, callback) => {
  if (isDev) {
    event.preventDefault();
    callback(true);
  } else {
    callback(false);
  }
});
