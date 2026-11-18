const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.ico': 'image/x-icon',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime'
};

const server = http.createServer((req, res) => {
    // 1. Handle API POST requests
    if (req.method === 'POST' && req.url === '/api/save') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const payload = JSON.parse(body);
                const { file, data } = payload;
                
                let filePath = '';
                if (file === 'settings') {
                    filePath = path.join(__dirname, 'assets', 'settings.json');
                } else if (file === 'projects') {
                    filePath = path.join(__dirname, 'assets', 'projects.json');
                } else {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: 'Invalid file target' }));
                }

                fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8', (err) => {
                    if (err) {
                        console.error('Error saving file:', err);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        return res.end(JSON.stringify({ error: 'Failed to write to file' }));
                    }
                    console.log(`Saved ${file}.json successfully!`);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true }));
                });
            } catch (err) {
                console.error('Error parsing JSON payload:', err);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
            }
        });
        return;
    }

    // 1b. Handle File Uploads
    if (req.method === 'POST' && req.url === '/api/upload') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const payload = JSON.parse(body);
                const { fileName, base64Data } = payload;

                if (!fileName || !base64Data) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: 'Missing fileName or base64Data' }));
                }

                // Strip Base64 header prefix if exists
                const base64Clean = base64Data.replace(/^data:[^;]+;base64,/, "");
                const buffer = Buffer.from(base64Clean, 'base64');

                // Determine file path based on extension
                const ext = path.extname(fileName).toLowerCase();
                let filePath = '';

                if (ext === '.pdf') {
                    filePath = path.join(__dirname, fileName);
                } else {
                    const uploadDir = path.join(__dirname, 'assets', 'uploads');
                    if (!fs.existsSync(uploadDir)) {
                        fs.mkdirSync(uploadDir, { recursive: true });
                    }
                    filePath = path.join(uploadDir, fileName);
                }

                fs.writeFile(filePath, buffer, (err) => {
                    if (err) {
                        console.error('Error uploading file:', err);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        return res.end(JSON.stringify({ error: 'Failed to write file to disk' }));
                    }
                    
                    console.log(`Uploaded ${fileName} successfully!`);
                    const relativePath = ext === '.pdf' ? fileName : `assets/uploads/${fileName}`;
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, filePath: relativePath }));
                });

            } catch (err) {
                console.error('Error parsing upload JSON payload:', err);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
            }
        });
        return;
    }

    // 2. Serve static files
    let rawUrl = req.url.split('?')[0];
    let filePath = path.join(__dirname, rawUrl === '/' ? 'index.html' : rawUrl);
    
    // Prevent directory traversal
    if (!filePath.startsWith(__dirname)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        return res.end('Forbidden');
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            // Serve 404 page
            let page404 = path.join(__dirname, '404.html');
            fs.readFile(page404, (err404, content404) => {
                if (err404) {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('404 Not Found');
                } else {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end(content404);
                }
            });
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, { 'Content-Type': contentType });
        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
    });
});

server.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`🚀 Daniel's WYSIWYG Editor Server running`);
    console.log(`👉 http://localhost:${PORT}`);
    console.log(`========================================`);
});
