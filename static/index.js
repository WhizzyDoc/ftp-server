function toast(msg) {
  const t = document.getElementById("toast");
  t.innerText = msg;
  t.classList.remove("hidden");
  setTimeout(() => t.classList.add("hidden"), 2000);
}

function digify(n, decimal=false) {
  a = Number(n)
  if(decimal) {
    return a.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})
  }
  else{
    return a.toLocaleString()
  }
  
}

function datify(date, time=false) {
  if(time) {
    return `${new Date(date).toDateString()} ${new Date(date).toLocaleTimeString()}`
  }
  else {
    return `${new Date(date).toDateString()}`;
  }
}

async function loadInfo(){
 const res = await fetch('/admin/info');
 const data = await res.json();
 $('#active').text(data.active)
 $('#sip').text(data.ip)
 $('#port').text(data.port)
 $('#password').text(data.password)
 $("#root-dir").text(data.root_directory)
 document.getElementById('qrImg').src=data.qr;
}

async function loadConnections(){
 const res = await fetch('/admin/connections');
 const data = await res.json();
 const el = document.getElementById('connections'); el.innerHTML='';
 $('#active').text(data.length)
 if(data.length > 0) {
 data.forEach(c=>{
     el.innerHTML += `<tr>
     <td style="white-space:nowrap">${c.ip}</td>
     <td style="min-width:250px;">${c.browser}</td>
     <td style="white-space:nowrap">${datify(c.login_time, true)}</td>
     <td style="white-space:nowrap">
     <button onclick="block('${c.ip}')" class="bg-red-600 px-3 py-1 rounded">Block</button>&nbsp;
    <button onclick="logout('${c.ip}')" class="bg-gray-700 px-3 py-1 rounded">Logout</button>
     </td></tr>`;
     });
 }
 else {
     el.innerHTML += `<tr>
 <td colspan="4" style="white-space:nowrap">No active connections.</td>
 </tr>`;
 }
}

async function loadBlocked(){
 const res = await fetch('/admin/blocked');
 const data = await res.json();
 const el = document.getElementById('blocked'); el.innerHTML='';
 if(data.length > 0) {
     data.forEach(ip=>{
     el.innerHTML += `<tr>
 <td style="white-space:nowrap">${ip}</td>
 <td style="white-space:nowrap">
 <button onclick="unblock('${ip}')" class="bg-yellow-600 px-3 py-1 rounded">Unblock</button>
 </td></tr>`;
     });
 }
 else {
     el.innerHTML += `<tr>
 <td colspan="2" style="white-space:nowrap">No blocked IP</td>
 </tr>`;
 }
}

async function block(ip){await fetch('/admin/block/'+ip,{method:'POST'});loadConnections();loadBlocked();}
async function unblock(ip){await fetch('/admin/unblock/'+ip,{method:'POST'});loadBlocked();}
async function logout(ip){await fetch('/admin/logout/'+ip,{method:'POST'});loadConnections();}

async function resetPassword(){
 const res = await fetch('/admin/reset-password',{method:'POST'});
 const data = await res.json();
 toast(data.message)
 await loadInfo()
}

// set default date
function setDate() {
    let date = new Date();
    let today = date.toISOString().split('T')[0]
    //alert(today)
    $("#logDate").val(today)
}
async function loadLogs(){
 const date=document.getElementById('logDate').value;
 const res = await fetch('/admin/logs?date='+date);
 const text = await res.text();
 document.getElementById('logs').innerText=text;
}

setInterval(loadConnections,5000);
setInterval(loadLogs,3000);

setDate();loadInfo();loadConnections();loadBlocked();
