import os
import socket
import secrets
import string
import zipfile
import io
import threading
from datetime import datetime
from functools import wraps

from flask import Flask, request, jsonify, send_from_directory, send_file
import qrcode


class LocalFTPServer:
    def __init__(self, root_dir, port=0, max_connections=10):
        self.app = Flask(__name__)

        self.root_dir = os.path.abspath(root_dir)
        self.port = port
        self.max_connections = max_connections

        # Security / session tracking
        self.active_connections = {}   # ip -> {info}
        self.failed_attempts = {}      # ip -> count
        self.blocked_ips = set()

        # Generate password
        self.password = self._generate_password()

        # Setup logging file
        self.log_file = os.path.join(self.root_dir, "server_logs.txt")

        self._setup_routes()

    # -------------------------
    # Utility Functions
    # -------------------------
    def _generate_password(self, length=12):
        chars = string.ascii_letters + string.digits + "!@#$%^&*"
        return ''.join(secrets.choice(chars) for _ in range(length))

    def _get_ip(self):
        return request.remote_addr

    def _log(self, message):
        timestamp = datetime.now().isoformat()
        with open(self.log_file, "a") as f:
            f.write(f"[{timestamp}] {message}\n")

    def _is_blocked(self, ip):
        return ip in self.blocked_ips

    def _auth_required(self, func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            ip = self._get_ip()

            if self._is_blocked(ip):
                return jsonify({"error": "IP blocked"}), 403

            if ip not in self.active_connections:
                return jsonify({"error": "Unauthorized"}), 401

            return func(*args, **kwargs)
        return wrapper

    def _safe_path(self, path):
        """Prevent directory traversal attacks"""
        full_path = os.path.abspath(os.path.join(self.root_dir, path))
        if not full_path.startswith(self.root_dir):
            raise Exception("Invalid path")
        return full_path

    # -------------------------
    # Connection Management
    # -------------------------
    def _login(self, ip, password):
        if self._is_blocked(ip):
            return False, "Blocked IP"

        if password != self.password:
            self.failed_attempts[ip] = self.failed_attempts.get(ip, 0) + 1

            if self.failed_attempts[ip] >= 4:
                self.blocked_ips.add(ip)
                self._log(f"IP BLOCKED: {ip}")
            return False, "Wrong password"

        # reset attempts on success
        self.failed_attempts[ip] = 0

        if len(self.active_connections) >= self.max_connections:
            return False, "Max connections reached"

        self.active_connections[ip] = {
            "ip": ip,
            "login_time": datetime.now().isoformat(),
            "browser": request.headers.get("User-Agent", "unknown")
        }

        self._log(f"LOGIN SUCCESS: {ip}")
        return True, "Login successful"

    def _logout(self, ip):
        if ip in self.active_connections:
            del self.active_connections[ip]
            self._log(f"LOGOUT: {ip}")

    # -------------------------
    # File Operations
    # -------------------------
    def _list_dir(self, path=""):
        full_path = self._safe_path(path)

        items = []
        for name in os.listdir(full_path):
            item_path = os.path.join(full_path, name)
            stat = os.stat(item_path)

            items.append({
                "name": name,
                "type": "dir" if os.path.isdir(item_path) else "file",
                "size": stat.st_size,
                "created": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                "modified": datetime.fromtimestamp(stat.st_mtime).isoformat()
            })

        return items

    def _delete_path(self, path):
        full_path = self._safe_path(path)

        if os.path.isdir(full_path):
            for root, dirs, files in os.walk(full_path, topdown=False):
                for f in files:
                    os.remove(os.path.join(root, f))
                for d in dirs:
                    os.rmdir(os.path.join(root, d))
            os.rmdir(full_path)
        else:
            os.remove(full_path)

    def _zip_dir(self, path):
        full_path = self._safe_path(path)

        memory_file = io.BytesIO()
        with zipfile.ZipFile(memory_file, 'w', zipfile.ZIP_DEFLATED) as zf:
            for root, _, files in os.walk(full_path):
                for file in files:
                    abs_path = os.path.join(root, file)
                    rel_path = os.path.relpath(abs_path, full_path)
                    zf.write(abs_path, rel_path)

        memory_file.seek(0)
        return memory_file

    # -------------------------
    # Routes
    # -------------------------
    def _setup_routes(self):

        # ---------------- LOGIN ----------------
        @self.app.route("/login", methods=["POST"])
        def login():
            ip = self._get_ip()
            data = request.json or {}
            password = data.get("password")

            success, msg = self._login(ip, password)

            self._log(f"LOGIN ATTEMPT {ip} - {msg}")
            return jsonify({"success": success, "message": msg})

        # ---------------- LOGOUT ----------------
        @self.app.route("/logout", methods=["POST"])
        def logout():
            ip = self._get_ip()
            self._logout(ip)
            return jsonify({"message": "Logged out"})

        # ---------------- FILE LIST ----------------
        @self.app.route("/api/<path:req_path>", methods=["GET"])
        @self._auth_required
        def get_files(req_path):
            try:
                full_path = self._safe_path(req_path)

                if os.path.isdir(full_path):
                    return jsonify(self._list_dir(req_path))

                return send_from_directory(
                    os.path.dirname(full_path),
                    os.path.basename(full_path),
                    as_attachment=False
                )

            except Exception as e:
                return jsonify({"error": str(e)}), 400

        # ---------------- UPLOAD ----------------
        @self.app.route("/api/<path:req_path>", methods=["POST"])
        @self._auth_required
        def upload(req_path):
            try:
                full_path = self._safe_path(req_path)

                if not os.path.isdir(full_path):
                    return jsonify({"error": "Not a directory"}), 400

                file = request.files["file"]
                save_path = os.path.join(full_path, file.filename)
                file.save(save_path)

                self._log(f"UPLOAD: {save_path} from {self._get_ip()}")
                return jsonify({"message": "Uploaded"})

            except Exception as e:
                return jsonify({"error": str(e)}), 400

        # ---------------- DELETE ----------------
        @self.app.route("/api/<path:req_path>", methods=["DELETE"])
        @self._auth_required
        def delete(req_path):
            try:
                self._delete_path(req_path)
                self._log(f"DELETE: {req_path} by {self._get_ip()}")
                return jsonify({"message": "Deleted"})
            except Exception as e:
                return jsonify({"error": str(e)}), 400

        # ---------------- DOWNLOAD ZIP DIR ----------------
        @self.app.route("/download/<path:req_path>", methods=["GET"])
        @self._auth_required
        def download(req_path):
            full_path = self._safe_path(req_path)

            if os.path.isdir(full_path):
                zip_data = self._zip_dir(req_path)
                return send_file(zip_data, download_name="archive.zip", as_attachment=True)

            return send_from_directory(os.path.dirname(full_path), os.path.basename(full_path), as_attachment=True)

    # -------------------------
    # Server Start
    # -------------------------
    def start(self):
        ip = self._get_local_ip()

        print("\n========== LOCAL FTP SERVER ==========")
        print(f"IP Address: {ip}")
        print(f"Port: {self.port if self.port else 'AUTO'}")
        print(f"Root Directory: {self.root_dir}")
        print(f"Max Connections: {self.max_connections}")
        print(f"PASSWORD: {self.password}")

        # QR Code
        qr = qrcode.make(self.password)
        qr_path = os.path.join(self.root_dir, "password_qr.png")
        qr.save(qr_path)

        print(f"QR Code saved at: {qr_path}")
        print("======================================\n")

        self.app.run(host="0.0.0.0", port=self.port, threaded=True)

    def _get_local_ip(self):
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
        except:
            ip = "127.0.0.1"
        finally:
            s.close()
        return ip


# -------------------------
# CLI Entry Point
# -------------------------
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Local FTP Server")

    parser.add_argument("directory", help="Root directory to expose")
    parser.add_argument("port", nargs="?", type=int, default=0)
    parser.add_argument("max_connections", nargs="?", type=int, default=10)

    args = parser.parse_args()

    server = LocalFTPServer(
        root_dir=args.directory,
        port=args.port,
        max_connections=args.max_connections
    )

    server.start()

#python main.py /storage/emulated/0 5000 10