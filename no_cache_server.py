import http.server
import socketserver

class NoCacheHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # 为所有响应添加禁用缓存的头信息
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

PORT = 8000

handler = NoCacheHTTPRequestHandler
with socketserver.TCPServer(("", PORT), handler) as httpd:
    print(f"服务器运行在端口 {PORT}，访问 http://localhost:{PORT}")
    httpd.serve_forever() 