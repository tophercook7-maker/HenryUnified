const {app,BrowserWindow}=require('electron');
function create(){const w=new BrowserWindow({width:1200,height:820,webPreferences:{contextIsolation:true}});
  const url='http://127.0.0.1:3000';
  w.webContents.on('did-fail-load',()=>setTimeout(()=>w.loadURL(url),500));
  w.loadURL(url);
}
app.whenReady().then(()=>{create();app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)create();});});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
