const { app, BrowserWindow } = require('electron');
function createWindow() { const win=new BrowserWindow({width:1200,height:820,webPreferences:{contextIsolation:true}}); const url='http://127.0.0.1:3000'; win.webContents.on('did-fail-load',()=>setTimeout(()=>win.loadURL(url),500)); win.loadURL(url); }
app.whenReady().then(()=>{createWindow();app.on('activate',()=>{if(require('electron').BrowserWindow.getAllWindows().length===0)createWindow();});});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
