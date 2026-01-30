let data = JSON.parse(localStorage.getItem("appData")) || { windows: [], wsap: "" };
let currentWin = null, dragIndex = null;
let deleteIndex = null;
let deleteFieldWin = null;
let deleteFieldIndex = null;

const save = () => localStorage.setItem("appData", JSON.stringify(data));

function refreshSelectors(){
  [editWin, delWin, dupWin, fieldWin, editFieldWin].forEach(s=>{
    s.innerHTML = data.windows.map((w,i)=>`<option value="${i}">${w.icon} ${w.name}</option>`).join("");
  });
  loadFields();
}

function render(){
  main.innerHTML = "";
  data.windows.forEach((w,i)=>{
    let d = document.createElement("div");
    d.className = "card";
    d.draggable = true;
    d.innerHTML = `${w.icon}<br>${w.name}`;
    d.onclick = () => openForm(i);

    d.ondragstart = () => { dragIndex = i; d.classList.add("dragging"); };
    d.ondragend = () => d.classList.remove("dragging");
    d.ondragover = e => e.preventDefault();
    d.ondrop = e => {
      e.preventDefault();
      let m = data.windows.splice(dragIndex,1)[0];
      data.windows.splice(i,0,m);
      save(); render();
    };
    main.appendChild(d);
  });
}

function openConfig(){
  wsap.value = data.wsap || "";
  refreshSelectors();
  config.style.display = "flex";
}

function closeConfig(){
  data.wsap = wsap.value;
  save(); render();
  config.style.display = "none";
}

function addWindow(){
  data.windows.push({ name:vName.value, icon:vIcon.value, fields:[] });
  vName.value = vIcon.value = "";
  save(); openConfig();
}

function saveWindowEdit(){
  let w = data.windows[editWin.value];
  w.name = newWinName.value || w.name;
  w.icon = newWinIcon.value || w.icon;
  newWinName.value = newWinIcon.value = "";
  save(); openConfig();
}

function deleteWindow(){
  deleteIndex = delWin.value;
  confirmModal.style.display = "flex";
}

function confirmDelete(){
  if(currentWin == deleteIndex){
    closeForm();
    currentWin = null;
  }
  data.windows.splice(deleteIndex,1);
  save();
  closeConfirm();
  openConfig();
}

function closeConfirm(){
  confirmModal.style.display = "none";
  deleteIndex = null;
}

function duplicateWindow(){
  let b = data.windows[dupWin.value];
  let c = JSON.parse(JSON.stringify(b));
  c.name = dupName.value || b.name + " (copia)";
  c.icon = dupIcon.value || b.icon;
  data.windows.push(c);
  dupName.value = dupIcon.value = "";
  save(); openConfig();
}

function addField(){
  let w = data.windows[fieldWin.value];
  w.fields.push({
    name:cName.value,
    icon:cIcon.value,
    type:cType.value,
    opt:cOpt.value,
    cam:cCam.checked
  });
  cName.value = cIcon.value = cOpt.value = "";
  cCam.checked = false;
  save();
}

function loadFields(){
  let w = data.windows[editFieldWin.value];
  if(!w) return;

  editField.innerHTML = w.fields
    .map((f,i)=>`<option value="${i}">${f.icon} ${f.name}</option>`).join("");

  fieldDelete.innerHTML = w.fields.map((f,i)=>`
    <div class="row">
      ${f.icon} ${f.name}
      <button onclick="askDeleteField(${editFieldWin.value},${i})">❌</button>
    </div>
  `).join("");
}

function saveFieldEdit(){
  let w = data.windows[editFieldWin.value];
  let f = w.fields[editField.value];
  f.name = editFieldName.value || f.name;
  f.icon = editFieldIcon.value || f.icon;
  editFieldName.value = editFieldIcon.value = "";
  save(); openConfig();
}

function askDeleteField(w,i){
  deleteFieldWin = w;
  deleteFieldIndex = i;
  confirmFieldModal.style.display = "flex";
}

function confirmDeleteField(){
  data.windows[deleteFieldWin].fields.splice(deleteFieldIndex,1);
  save();
  closeFieldConfirm();
  loadFields();
}

function closeFieldConfirm(){
  confirmFieldModal.style.display = "none";
  deleteFieldWin = deleteFieldIndex = null;
}

function openForm(i){
  currentWin = i;
  let w = data.windows[i];
  formTitle.innerText = w.icon + " " + w.name;
  formFields.innerHTML = "";

  w.fields.forEach((f,idx)=>{
    let d = document.createElement("div");
    d.className = "field";
    d.innerHTML = `<label>${f.icon} ${f.name}</label>`;

    if(f.type === "auto"){
      d.innerHTML += `<input value="${new Date().toLocaleString()}" disabled>`;
    } else if(f.opt){
      d.innerHTML += `<select data-i="${idx}">
        ${f.opt.split("|").map(o=>`<option>${o}</option>`).join("")}
      </select>`;
    } else {
      d.innerHTML += `<input data-i="${idx}">`;
    }

    if(f.cam){
      let fi = document.createElement("input");
      fi.type = "file";
      fi.accept = "image/*";
      fi.capture = "environment";
      fi.onchange = () => {
        let img = document.createElement("img");
        img.className = "preview";
        img.src = URL.createObjectURL(fi.files[0]);
        fi.after(img);
      };
      d.appendChild(fi);
    }

    formFields.appendChild(d);
  });

  formModal.style.display = "flex";
}

function sendWhats(){
  let w = data.windows[currentWin];
  let msg = `${w.icon} ${w.name}\n\n`;
  document.querySelectorAll("#formFields input,select").forEach(e=>{
    if(e.dataset.i !== undefined){
      let f = w.fields[e.dataset.i];
      msg += `${f.icon} ${f.name}: ${e.value}\n`;
    }
  });
  window.open(`https://wa.me/${data.wsap}?text=` + encodeURIComponent(msg));
}

function clearForm(){
  document.querySelectorAll("#formFields input").forEach(i=>{
    if(!i.disabled) i.value = "";
  });
  document.querySelectorAll("img.preview").forEach(i=>i.remove());
}

function closeForm(){
  formModal.style.display = "none";
}

render();
