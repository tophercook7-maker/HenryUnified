const { app, BrowserWindow } = require("electron");
app.disableHardwareAcceleration();
async function create(){
  const win=new BrowserWindow({
    width:1200,height:800,backgroundColor:"#0b0c10",
    webPreferences:{ nodeIntegration:false, contextIsolation:true, sandbox:true }
  });
  // splash while server boots
  win.loadURL(
'data:text/html,<html><body style="margin:0;height:100vh;display:flex;align-items:center;justify-content:center;background:#0b0c10;color:#e6e8f0;font:16px -apple-system,system-ui,Segoe UI,Roboto,Inter,sans-serif">Henry is starting…</body></html>'
  );
  const url="http://127.0.0.1:3000";
  const ok=async()=>{try{const r=await fetch(url+"/health",{cache:"no-store"});return r.ok;}catch{return false}};
  let tries=0;const t=setInterval(async()=>{tries++;if(await ok()){clearInterval(t);win.loadURL(url);} },500);
}
app.whenReady().then(create);
app.on("window-all-closed",()=>{ if(process.platform!=="darwin") app.quit(); });
