const http = require('http');
const fs = require('fs');

const server = http.createServer((req, res) => {
    console.log("DEBUG: Request received at", new Date().toISOString());
    console.log("DEBUG: Method:", req.method);
    console.log("DEBUG: URL:", req.url);
    
    if (req.method === "POST" && req.url === "/api/process") {
        let body = "";
        req.on("data", chunk => body += chunk);
        req.on("end", () => {
            try {
                const data = JSON.parse(body);
                const response = "Hello from Henry! You said: " + data.input;
                const projectDir = "./generated/" + Date.now();
                fs.mkdirSync(projectDir, { recursive: true });
                fs.writeFileSync(projectDir + "/output.txt", response);
                
                res.writeHead(200, {"Content-Type": "application/json"});
                res.end(JSON.stringify({
                    response: response,
                    path: projectDir + "/output.txt",
                    message: "Henry has processed your request!"
                }));
            } catch (error) {
                console.error("ERROR:", error);
                res.writeHead(400, {"Content-Type": "application/json"});
                res.end(JSON.stringify({error: error.message}));
            }
        });
    } else {
        // Serve HTML interface
        res.writeHead(200, {"Content-Type": "text/html"});
        res.end(`
            <!DOCTYPE html>
            <html>
            <head><title>Henry AI</title></head>
            <body>
                <h1>Henry AI System</h1>
                <input type="text" id="input" placeholder="Ask Henry anything">
                <button onclick="sendMessage()">Send</button>
                <div id="response"></div>
                <script>
                    async function sendMessage() {
                        const input = document.getElementById("input").value;
                        const response = await fetch("/api/process", {
                            method: "POST",
                            headers: {"Content-Type": "application/json"},
                            body: JSON.stringify({input: input})
                        });
                        const data = await response.json();
                        document.getElementById("response").innerHTML = data.response + "<br>File created: " + data.path;
                    }
                </script>
            </body>
            </html>
        `);
    }
});

server.listen(8080, () => {
    console.log("Henry AI running on http://localhost:8080");
    console.log("Check console for debug information");
});
