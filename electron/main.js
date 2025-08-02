const { app, BrowserWindow, Menu, dialog, shell } = require("electron")
const path = require("path")
const isDev = process.env.NODE_ENV === "development"

let mainWindow

function createWindow() {
  // Создаем главное окно
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
    },
    icon: path.join(__dirname, "icon.png"),
    show: false,
    titleBarStyle: "default",
  })

  // Загружаем приложение
  if (isDev) {
    mainWindow.loadURL("http://localhost:3000")
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, "../out/index.html"))
  }

  // Показываем окно когда готово
  mainWindow.once("ready-to-show", () => {
    mainWindow.show()

    if (isDev) {
      mainWindow.webContents.openDevTools()
    }
  })

  // Обработка закрытия окна
  mainWindow.on("close", (event) => {
    if (!app.isQuiting) {
      event.preventDefault()
      const choice = dialog.showMessageBoxSync(mainWindow, {
        type: "question",
        buttons: ["Да", "Нет"],
        title: "Подтверждение",
        message: "Вы действительно хотите закрыть приложение?",
        defaultId: 0,
        cancelId: 1,
      })

      if (choice === 0) {
        app.isQuiting = true
        app.quit()
      }
    }
  })

  // Обработка ошибок загрузки
  mainWindow.webContents.on("did-fail-load", (event, errorCode, errorDescription) => {
    console.error("Failed to load:", errorCode, errorDescription)

    if (!isDev) {
      dialog.showErrorBox(
        "Ошибка загрузки",
        `Не удалось загрузить приложение.\nКод ошибки: ${errorCode}\nОписание: ${errorDescription}`,
      )
    }
  })

  // Открываем внешние ссылки в браузере
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: "deny" }
  })
}

// Создаем меню приложения
function createMenu() {
  const template = [
    {
      label: "Файл",
      submenu: [
        {
          label: "Обновить",
          accelerator: "F5",
          click: () => {
            mainWindow.reload()
          },
        },
        {
          label: "Принудительное обновление",
          accelerator: "Ctrl+F5",
          click: () => {
            mainWindow.webContents.reloadIgnoringCache()
          },
        },
        { type: "separator" },
        {
          label: "Выход",
          accelerator: process.platform === "darwin" ? "Cmd+Q" : "Ctrl+Q",
          click: () => {
            app.isQuiting = true
            app.quit()
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
            const currentZoom = mainWindow.webContents.getZoomLevel()
            mainWindow.webContents.setZoomLevel(currentZoom + 0.5)
          },
        },
        {
          label: "Уменьшить",
          accelerator: "Ctrl+-",
          click: () => {
            const currentZoom = mainWindow.webContents.getZoomLevel()
            mainWindow.webContents.setZoomLevel(currentZoom - 0.5)
          },
        },
        {
          label: "Сбросить масштаб",
          accelerator: "Ctrl+0",
          click: () => {
            mainWindow.webContents.setZoomLevel(0)
          },
        },
        { type: "separator" },
        {
          label: "Полный экран",
          accelerator: "F11",
          click: () => {
            mainWindow.setFullScreen(!mainWindow.isFullScreen())
          },
        },
        { type: "separator" },
        {
          label: "Инструменты разработчика",
          accelerator: "F12",
          click: () => {
            mainWindow.webContents.toggleDevTools()
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
            })
          },
        },
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// Готовность приложения
app.whenReady().then(() => {
  createWindow()
  createMenu()

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Закрытие всех окон
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})

// Обработка ошибок
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error)
  dialog.showErrorBox("Критическая ошибка", error.message)
})

app.on("certificate-error", (event, webContents, url, error, certificate, callback) => {
  if (isDev) {
    // В режиме разработки игнорируем ошибки сертификатов
    event.preventDefault()
    callback(true)
  } else {
    callback(false)
  }
})
