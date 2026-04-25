let baseUrl = "";
let currentPath = "";
let selectedItem = null;
let historyStack = [];

function toast(msg) {
  const t = document.getElementById("toast");
  t.innerText = msg;
  t.classList.remove("hidden");
  setTimeout(() => t.classList.add("hidden"), 2000);
}

async function login() {
  const password = $("#passwordInput").val();
    //toast(password)
  const res = await fetch("/login", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({password})
  });

  const data = await res.json();

  if (data.success) {
    showApp()
    toast("Login success");
    fetchFiles("");
  } else {
    toast(data.message);
  }
}

function formatSize(bytes) {
  if (bytes === 0 || bytes === undefined) return "-";

  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;

  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }

  return `${bytes.toFixed(2)} ${units[i]}`;
}

function getFileExtension(filename, type) {
  if (type === "dir") return ""; // skip directories
  if (!filename || !filename.includes(".")) return "";

  return filename.slice(filename.lastIndexOf(".") + 1).toLowerCase();
}


function getFileIcon(filename, type) {
    const icons = {
      jpg: "🖼️",
      png: "🖼️",
      mp4: "🎬",
      mkv: "🎬",
      wav: "🔊",
      html: "🌐",
      mp3: "🎵",
      pdf: "📄",
      zip: "📦",
      sample: "📁"
    };
    let ext = getFileExtension(filename, type) || "sample";
    return icons[ext] || "📄"
}

function truncateName(name, maxLength = 25) {
  if (!name || name.length <= maxLength) return name;

  const extIndex = name.lastIndexOf(".");

  // If no extension OR it's a directory-like name
  if (extIndex === -1 || extIndex === 0) {
    return name.slice(0, maxLength - 3) + "...";
  }

  const ext = name.slice(extIndex); // ".jpg"
  const base = name.slice(0, extIndex);

  const allowedBaseLength = maxLength - ext.length - 3;

  if (allowedBaseLength <= 0) {
    return "..." + ext;
  }

  return base.slice(0, allowedBaseLength) + "..." + ext;
}

function sortItems(items) {
  return items.sort((a, b) => {
    // 1. Directories first
    if (a.type === "dir" && b.type !== "dir") return -1;
    if (a.type !== "dir" && b.type === "dir") return 1;

    // 2. Then sort by name (case-insensitive, natural order)
    return a.name.localeCompare(b.name, undefined, {
      numeric: true,
      sensitivity: "base"
    });
  });
}

async function fetchFiles(path) {
  currentPath = path;
  document.getElementById("pathBar").value = path;
  
  try {

      const res = await fetch(`/api${currentPath}`);
    
      if (res.status === 401) {
          toast("Kindly login to continue")
        showLogin();
        return;
      }
    
      const data = await res.json();
      
      let sortedItems = sortItems(data)
    
      const tbody = document.getElementById("fileTable");
      tbody.innerHTML = "";

      sortedItems.forEach(item => {
        const row = document.createElement("tr");
        row.className = "hover:bg-gray-800 cursor-pointer";
    
        row.innerHTML = `
          <td style="white-space:nowrap">${getFileIcon(item.name, item.type)}&nbsp;&nbsp;${truncateName(item.name)}</td>
          <td style="white-space:nowrap">${item.type.toUpperCase()}/${getFileExtension(item.name, item.type).toUpperCase()}</td>
          <td style="white-space:nowrap">${formatSize(item.size)}</td>
        `;
    
        row.onclick = () => {
          selectedItem = item;
          document.querySelectorAll("tr").forEach(r => r.classList.remove("bg-gray-700"));
          row.classList.add("bg-gray-700");
        };
    
        row.ondblclick = () => {
          if (item.type === "dir") {
            historyStack.push(currentPath);
            fetchFiles(currentPath + "/" + item.name);
          } else {
            window.open(`/api/${currentPath}/${item.name}`, "_blank");
          }
        };
    
        tbody.appendChild(row);
      });
  }
  catch(err) {
      toast(err)
  }
}

function goBack() {
  const prev = historyStack.pop();
  if (prev !== undefined) fetchFiles(prev);
}

function goToPath() {
  const path = document.getElementById("pathBar").value;
  fetchFiles(path);
}

function triggerUpload() {
  document.getElementById("fileInput").click();
}


async function uploadFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  // Show modal
  const modal = document.getElementById("uploadModal");
  const bar = document.getElementById("progressBar");
  const text = document.getElementById("progressText");
  const name = document.getElementById("uploadFileName");

  modal.classList.remove("hidden");
  modal.classList.add("flex");
  bar.style.width = "0%";
  text.innerText = "0%";
  name.innerText = file.name;

  const xhr = new XMLHttpRequest();

  xhr.upload.onprogress = function(e) {
    if (e.lengthComputable) {
      const percent = Math.round((e.loaded / e.total) * 100);
      bar.style.width = percent + "%";
      text.innerText = percent + "%";
    }
  };

  xhr.onload = () => {
    toast("Upload complete");
    fetchFiles(currentPath);
    bar.style.width = "0%";
    text.innerText = "0%";

    // Hide modal
    setTimeout(() => {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    }, 500);
  };

  xhr.onerror = () => {
    toast("Upload failed");
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  };

  xhr.open("POST", `/api${currentPath}`);
  xhr.send(formData);
}

async function deleteItem() {
  if (!selectedItem) return;
  
  document.getElementById("deleteItemName").innerText = selectedItem.name;

  const modal = document.getElementById("deleteModal");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

async function confirmDelete() {
  if (!selectedItem) return;

  await fetch(`/api/${currentPath}/${selectedItem.name}`, {
    method: "DELETE"
  });

  toast("Deleted");
  closeDeleteModal();
  fetchFiles(currentPath);
}

function closeDeleteModal() {
  const modal = document.getElementById("deleteModal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

function downloadItem() {
  if (!selectedItem) return;
  window.open(`/download/${currentPath}/${selectedItem.name}`, "_blank");
}

function openItem() {
  if (!selectedItem) return;
  
  if (selectedItem.type === "dir") {
        historyStack.push(currentPath);
        fetchFiles(currentPath + "/" + selectedItem.name);
   }
  else if (selectedItem.type === "file") {
    window.open(`/api/${currentPath}/${selectedItem.name}`, "_blank");
  }
}

async function logout() {
  await fetch("/logout", {method:"POST"});
  location.reload();
}

async function showApp() {
    document.getElementById("loginView").classList.add("hidden");
    document.getElementById("appView").classList.remove("hidden");
}

async function showLogin() {
    document.getElementById("loginView").classList.remove("hidden");
    document.getElementById("appView").classList.add("hidden");
}
// QR Scanner
function startQR() {
  const scanner = new Html5Qrcode("qr-reader");

  toast("Opening scanner...");

  scanner.start(
    { facingMode: "environment" },
    { fps: 10 },
    (decodedText) => {
      scanner.stop();
      $("#passwordInput").val(decodedText);
      login();
    }
  ).catch(err => {
    console.error(err);
    toast("Camera access denied or not supported");
  });
}

async function checkSession() {
    try {
        const res = await fetch("/session")
        const data = await res.json();
        if(data.logged_in) {
            showApp();
            fetchFiles("")
        }
        else {
            showLogin();
            //startQR()
            toast("Kindly login to continue.")
        }
    }
    catch(err) {
        toast(err)
    }
}


// ================ Event Listeners ==================
$(document).ready(async () => await checkSession());
$(".qr-btn").on('click', startQR)
$('.login-btn').on('click', login)
$('.back-btn').on('click', goBack)
$('.download-btn').on('click', downloadItem)
$(".upload-btn").on('click', triggerUpload)
$('.delete-btn').on('click', deleteItem)
$('.open-btn').on('click', openItem)
$('.path-btn').on('click', goToPath)
$('.logout-btn').on('click', logout)
$("#fileInput").on('change', (e) => uploadFile(e))

