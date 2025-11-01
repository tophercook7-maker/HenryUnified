const fs=require("fs");
const f="src/server.ts";
let s=fs.readFileSync(f,"utf8");
if(!/express\\.static/.test(s)){
  s=s.replace(/const app = express\\(\\);/, 
    String.raw`const app = express();
import path from "path";
app.use(express.static(path.join(process.cwd(), "server", "public")));`
  );
}
if(!/sendFile\\([^)]*index\\.html/.test(s)){
  if(!/import path from "path"/.test(s)) s = String.raw`import path from "path";\n`+s;
  s += String.raw`
// SPA fallback to built index.html
app.get("/*",(req,res)=>{
  res.sendFile(path.join(process.cwd(),"server","public","index.html"));
});`;
}
fs.writeFileSync(f,s);
