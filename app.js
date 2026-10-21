let folders = [];
let selectedFolderId = null;
let renamingFolderId = null;
let deleteTargetId = null;

// フォルダ管理
function findFolderById(folderId, items = folders) {
  for (const item of items) {
    if (item.id === folderId) return item;
    if (item.children && item.children.length) {
      const found = findFolderById(folderId, item.children);
      if (found) return found;
    }
  }
  return null;
}

function removeFolderById(folderId, items = folders) {
  const index = items.findIndex((item) => item.id === folderId);
  if (index !== -1) {
    items.splice(index, 1);
    return true;
  }

  for (const item of items) {
    if (item.children && item.children.length) {
      if (removeFolderById(folderId, item.children)) return true;
    }
  }
  return false;
}

// モバイル環境用UI
function openRenameModal(folderId) {
  const folder = findFolderById(folderId);
  if (!folder) return;

  renamingFolderId = folderId;
  selectedFolderId = folderId;

  const input = document.getElementById("renameInput");
  const modal = document.getElementById("renameModal");

  input.value = folder.name || "";
  modal.classList.add("show");

  setTimeout(() => input.focus(), 50);
}

function saveFolderName() {
  if (!renamingFolderId) return;

  const folder = findFolderById(renamingFolderId);
  if (!folder) return;

  const input = document.getElementById("renameInput");
  const rawValue = input.value.trim();

  let newName = rawValue || "Untitled";

  if (!newName) newName = "Untitled";

  folder.name = newName;
  renamingFolderId = null;
  closeRenameModal();

  renderFolderList();
}

function cancelRename() {
  renamingFolderId = null;
  closeRenameModal();
}

function closeRenameModal() {
  const modal = document.getElementById("renameModal");
  modal.classList.remove("show");
}

// フォルダ削除フロー
function openDeleteModal(folderId) {
  const folder = findFolderById(folderId);
  if (!folder) return;

  deleteTargetId = folderId;
  selectedFolderId = folderId;

  const modal = document.getElementById("deleteModal");
  const label = document.getElementById("deleteFolderName");

  label.textContent = folder.name || "Untitled";
  modal.classList.add("show");
}

function confirmDelete() {
  if (!deleteTargetId) return;

  removeFolderById(deleteTargetId);
  if (selectedFolderId === deleteTargetId) selectedFolderId = null;

  deleteTargetId = null;
  closeDeleteModal();

  renderFolderList();
}

function cancelDelete() {
  deleteTargetId = null;
  closeDeleteModal();
}

function closeDeleteModal() {
  const modal = document.getElementById("deleteModal");
  modal.classList.remove("show");
}

// フォルダ作成フロー
function addFolder() {
  const parentFolder = selectedFolderId ? findFolderById(selectedFolderId) : null;
  const newFolder = {
    id: Date.now() + Math.random(),
    name: "Untitled",
    children: []
  };

  if (parentFolder) {
    parentFolder.children.push(newFolder);
  } else {
    folders.push(newFolder);
  }

  renderFolderList();

  // フォルダ命名
  openRenameModal(newFolder.id);
}