# 📁 Local FTP File Sharing Server (Over WiFi)
A lightweight, secure, and fully local **FTP-style file sharing system** built with **Python (Flask)** and a **modern web-based file manager UI**.
This project allows devices connected to the same WiFi network to:
- Access shared files
- Upload/download content
- Manage directories
- Interact through a clean browser interface.
- No internet required. No external server. Fully local.

## 🚀 Features

--- ### 🔐 Security & Access Control
- Random password generated at runtime
- QR code (or ASCII QR) login support
- IP-based session tracking
- Maximum connection limit
- Failed login protection (auto-block after 4 attempts)
- Only authenticated users can access files

--- ### 📂 File Management
- Browse directories recursively
- Open files directly in browser
- Upload files (with progress tracking)
- Download files
- Download folders as ZIP (no server storage)
- Delete files and directories (recursive)

--- ### 🖥️ User Interface
- Dark-mode modern file manager (Tailwind CSS)
- Table view (name, type, size)
- Click to select, double-click to open
- Path navigation + search bar
- Toast notifications
- QR scanner login support (camera-based)
--- ### 📡 Networking
- Runs on local IPv4 address
- Accessible by any device on same WiFi
- No internet dependency

--- ### 🖥️ Admin Interface
- Live connection management (view, block, unblock, logout)
- Password reset (automatically logs out all active users)
- Live activity log viewing (polling request, rather than websockets)

--- ### 📜 Logging
- Logs every request:
- IP address
- endpoint accessed
- HTTP method
- timestamp

## 📦 Project Structure 
project/
    |-- logs/ # log files directory
    ├── main.py # Backend server 
    ├── static/     # static directory containing css and js file
    |── index.html # Frontend UI
    ├── requirements.txt    # project dependencies
    └── README.md

## ⚙️ Requirements
### Install Python Dependencies
```bash
pip install -r requirements.txt
```

To run on Android Termux, it's recommended to avoid Pillow and use ASCII QR instead.

▶️ How to Run

```bash
python main.py <root_directory> [port] [max_connections] [secure]
```
- The `root_directory` represents the entry point for file access. Only files and directories under this root_directory can be accessed over the network.
- The `port` represents the port on ehich the server will be accessible. If not provided, the default is 5000.
- `max_connections` represent the maximum number of allowed connection to the server. default is 50
- `secure` represent the secure context (to use https: or http:). value is binary (0 for False or 1 for True). secure context is required to use QR scanning on the client side. default value is 0

Example:
```bash
python main.py C:\Users 5000 10 0
```

🖥️ Server Output

When started, the server displays:
- Local IPv4 address
- Port number
- Root directory
- Maximum connections
- Secure connection state
- Generated password
- QR code (terminal ASCII)

Example:
```bash
========== LOCAL FTP SERVER ==========
IP Address: 192.168.1.5
Port: 5000
Root Directory: C:\Users
Max Connections: 10
Secure Connection: False
PASSWORD: Xy@12#AbC!

Scan this QR code (or use password):

(QR Code is displayed here)
======================================
```

- To use the secure context (https:), run the following command in your bash terminal. you may need to instyall `openssl` first.
- save the output certificates `key.pem` and `cert.pem` in the project root folder

```bash
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes
```

## 🌐 Accessing the Server

### User Interface

On another device connected to the same WiFi:

- Open your web browser
- Enter: http://<IP_ADDRESS>:<PORT> (or https: if secure context)
- Example:http://192.168.1.5:5000 
- Login using: Password OR QR scan (only available for secure connection)
- 4 consecutive failed login attempts results in automatic IP blockage (until admin unblocks)

### Admin Interface

Admin interface can only be accessed on the same device running the server

- Open your web browser
- Enter: http://127.0.0.1:<PORT> (or https: if secure context)
- Example:http://127.0.0.1:5000 
- No password required. Only security measure in place is to restrict access to the same device running the server (possible improvement by adding password protection)

🧠 API Overview

| Method | Endpoint | Description |
-----------------------------------
| GET | / | User Interface page |
| GET | /session | Fetch user login status |
| POST | /login | Authenticate user |
| POST | /logout | Logout user |
| GET | /api/<path> | Fetch file/folder |
| POST | /api/<path> | Upload file |
| DELETE | /api/<path> | Delete file/folder |
| GET | /download/<path> | Download file or ZIP |
| GET | /admin | Admin Interface |
| GET | /admin/info | Get server information |
| GET | /admin/connections | Get active connections |
| POST | /admin/block/<ip> | Block an IP address |
| POST | /admin/unblock/<ip> | Unblock an IP address |
| POST | /admin/logout/<ip> | Log out a user |
| GET | /admin/blocked | Get blocked IPs |
| POST | /admin/reset-password | Reset server password |
| GET | /admin/logs | Get activity logs (filterable by date) |
--------------------------------------------------------------


### 🔒 Security Notes

- Only logged-in IPs can access files
- IPs are blocked after repeated failed attempts
- Path traversal is prevented (safe path validation)
- No files are stored during ZIP operations (memory only)

### 📱 Termux Notes (Android)

If running on Termux, install the following packages before installing the project requirements:

```bash
pkg update && pkg install python clang make libjpeg-turbo libpng freetype openssl openssl-tool
```

### 🛠️ Possible Improvements

- Drag & drop uploads
- File preview (images, videos, PDFs)
- Real-time updates (WebSockets)
- Multi-user activity dashboard
- HTTPS support
- Device auto-discovery (no IP input)

### 📄 License

This project is open-source and available under the MIT License.

### 👨‍💻 Author

Developed by WhizzyDoc as a local network file sharing solution combining:
- Backend (Python)
- Frontend (HTML + Tailwind + JS)

### ⭐ Support

If you found this useful:
Star the repo ⭐
Share with others
Contribute improvements
