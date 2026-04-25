# 📁 Local FTP File Sharing Server (WiFi)
A lightweight, secure, and fully local **FTP-style file sharing system** built with **Python (Flask)** and a **modern web-based file manager UI**.
This project allows devices connected to the same WiFi network to:
- Access shared files
- Upload/download content
- Manage directories
- Interact through a clean browser interface No internet required. No external server. Fully local.
---
## 🚀 Features ###
🔐 Security & Access Control - Random password generated at runtime - QR code (or ASCII QR) login support - IP-based session tracking - Maximum connection limit - Failed login protection (auto-block after 4 attempts) - Only authenticated users can access files --- ### 📂 File Management - Browse directories recursively - Open files directly in browser - Upload files (with progress tracking) - Download files - Download folders as ZIP (no server storage) - Delete files and directories (recursive) --- ### 🖥️ User Interface - Dark-mode modern file manager (Tailwind CSS) - Table view (name, type, size, created, modified) - Click to select, double-click to open - Path navigation + search bar - Toast notifications - QR scanner login support (camera-based) --- ### 📡 Networking - Runs on local IPv4 address - Accessible by any device on same WiFi - No internet dependency --- ### 📜 Logging - Logs every request: - IP address - endpoint accessed - HTTP method - timestamp --- ## 📦 Project Structure 

project/ │ ├── main.py # Backend server ├── index.html # Frontend UI └── README.md

--- ## ⚙️ Requirements ### Python Dependencies ```bash pip install flask qrcode 

⚠️ Optional: If using image QR codes:

pip install pillow 

For Termux users, it's recommended to avoid Pillow and use ASCII QR instead.

▶️ How to Run

```bash
python main.py <directory> [port] [max_connections] 
```

Example:

python main.py /storage/emulated/0 5000 10 

🖥️ Server Output

When started, the server displays:

Local IPv4 address

Port number

Root directory

Maximum connections

Generated password

QR code (file or terminal ASCII)

Example:

========== LOCAL FTP SERVER ========== IP Address: 192.168.1.5 Port: 5000 Root Directory: /storage/emulated/0 Max Connections: 10 PASSWORD: Xy@12#AbC! ====================================== 

🌐 Accessing the Server

On another device connected to the same WiFi:

Open browser

Enter:

http://<IP_ADDRESS>:<PORT> 

Example:

http://192.168.1.5:5000 

Login using: 

Password

OR QR scan

🧠 API Overview

MethodEndpointDescriptionPOST/loginAuthenticate userPOST/logoutLogout userGET/api/<path>Fetch file/folderPOST/api/<path>Upload fileDELETE/api/<path>Delete file/folderGET/download/<path>Download file or ZIP 

🔒 Security Notes

Only logged-in IPs can access files

IPs are blocked after repeated failed attempts

Path traversal is prevented (safe path validation)

No files are stored during ZIP operations (memory only)

📱 Termux Notes (Android)

If running on Termux:

pkg update pkg install python clang make libjpeg-turbo libpng freetype rust openssl libffi

Or install prebuilt Pillow:

pkg install python-pillow 

👉 Recommended: use ASCII QR instead of Pillow to avoid build issues.

🛠️ Possible Improvements

Drag & drop uploads

File preview (images, videos, PDFs)

Real-time updates (WebSockets)

Multi-user activity dashboard

HTTPS support

Device auto-discovery (no IP input)

📄 License

This project is open-source and available under the MIT License.

👨‍💻 Author

Developed as a local network file sharing solution combining:

Backend (Python)

Frontend (HTML + Tailwind + JS)

⭐ Support

If you found this useful:

Star the repo ⭐

Share with others

Contribute improvements

--- If you want next, I can also: - generate a **project logo + banner for GitHub** - or help you **package this as an installable CLI tool (`pip install`)** - or even turn it into a **mobile app wrapper (APK)** 