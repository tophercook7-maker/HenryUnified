const { app, BrowserWindow, dialog } = require('electron');
const { spawn } = require('child_process');

async function ensureServer() {
  return true; // TODO: implement health check later
}

async function createWindow() {
  const ok = await ensureServer();
  if (!ok) {
    dialog.showErrorBox('Henry Server', 'Could not start Henry server on :3000');
    return;
  }

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: { contextIsolation: true }
  });

  win.loadURL('http://127.0.0.1:3000');
}

const got = app.requestSingleInstanceLock();
if (!got) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const w = BrowserWindow.getAllWindows()[0];
    if (w) { w.show(); w.focus(); }
  });

  app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
app.on("activate", () => {
  const { BrowserWindow } = require("electron");
  if (BrowserWindow.getAllWindows().length === 0) {
    const win = new BrowserWindow({
      width:1200,height:800,backgroundColor:"#0b0c10",
      webPreferences:{ nodeIntegration:false, contextIsolation:true, sandbox:true }
    });
    const url="http://127.0.0.1:3000";
    win.loadURL(url);
  }
});
