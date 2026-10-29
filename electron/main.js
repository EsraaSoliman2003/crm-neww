/* eslint-disable @typescript-eslint/no-require-imports */
const { app, BrowserWindow, shell } = require("electron");
const http = require("http");
const next = require("next");
const path = require("path");

const isDev = !app.isPackaged;
const devServerUrl =
  process.env.ELECTRON_DEV_SERVER_URL || "http://localhost:3000";
const productionPort = Number(process.env.ELECTRON_NEXT_PORT || 3657);

let nextServer;
let httpServer;
let mainWindow;

async function startNextServer() {
  const nextApp = next({
    dev: false,
    dir: app.getAppPath(),
    hostname: "127.0.0.1",
    port: productionPort,
  });
  const handle = nextApp.getRequestHandler();

  await nextApp.prepare();

  return new Promise((resolve, reject) => {
    httpServer = http
      .createServer((req, res) => handle(req, res))
      .once("error", reject)
      .listen(productionPort, "127.0.0.1", () => {
        nextServer = nextApp;
        resolve(`http://127.0.0.1:${productionPort}`);
      });
  });
}

async function createWindow() {
  const startUrl = isDev ? devServerUrl : await startNextServer();

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: "CRM",
    backgroundColor: "#f7f7f7",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://127.0.0.1") || url.startsWith(devServerUrl)) {
      return { action: "allow" };
    }

    shell.openExternal(url);
    return { action: "deny" };
  });

  await mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }
}

app.whenReady().then(createWindow);

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", async () => {
  if (httpServer) {
    httpServer.close();
  }

  if (nextServer?.close) {
    await nextServer.close();
  }
});
