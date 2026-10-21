const randomUnreadCount = () => {
  const shouldHaveNotification = Math.random() < 0.6;
  return shouldHaveNotification ? Math.floor(Math.random() * 9) + 1 : 0;
};

const folders = [
  {
    id: "sample-ooo",
    name: "○○部",
    children: [
      { id: "sample-ooo-talk", name: "雑談", unread: 12, children: [] },
      { id: "sample-ooo-event", name: "行事", unread: 7, children: [] },
      { id: "sample-ooo-work", name: "業務連絡", unread: 5, children: [] },
      { id: "sample-ooo-attendance", name: "出欠", unread: 3, children: [] }
    ]
  },
  {
    id: "sample-circle",
    name: "サークル",
    children: [
      { id: "sample-circle-fitness", name: "体育会", unread: 6, children: [] },
      { id: "sample-circle-culture", name: "文化系", unread: 2, children: [] },
      { id: "sample-circle-other", name: "その他", unread: 1, children: [] }
    ]
  },
  {
    id: "sample-edu",
    name: "学科関係",
    children: [
      { id: "sample-edu-lecture", name: "講義連絡", unread: 4, children: [] },
      { id: "sample-edu-seminar", name: "ゼミ", unread: 3, children: [] },
      { id: "sample-edu-lab", name: "研究室", unread: 2, children: [] },
      { id: "sample-edu-chat", name: "学科の雑談", unread: 8, children: [] },
      { id: "sample-edu-other", name: "その他", unread: 1, children: [] }
    ]
  },
  {
    id: "sample-other",
    name: "その他",
    unread: randomUnreadCount(),
    children: []
  }
];

let selectedFolderId = null;
let renamingFolderId = null;
let deleteTargetId = null;
const expandedFolderIds = new Set(["sample-ooo", "sample-circle", "sample-edu"]);

function normalizeName(name) {
  const trimmed = (name || "").trim();
  return trimmed === "" || trimmed.toLowerCase() === "untitled" ? "Untitled" : trimmed;
}

function getUnreadTotal(item) {
  if (!item) return 0;

  if (!item.children || item.children.length === 0) {
    return Number(item.unread || 0);
  }

  return item.children.reduce((sum, child) => sum + getUnreadTotal(child), 0);
}

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

function openRenameModal(folderId) {
  const folder = findFolderById(folderId);
  if (!folder) return;

  renamingFolderId = folderId;
  selectedFolderId = folderId;

  const input = document.getElementById("renameInput");
  const modal = document.getElementById("renameModal");
  if (!input || !modal) return;

  input.value = folder.name || "";
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
  setTimeout(() => input.focus(), 50);
}

function closeRenameModal() {
  const modal = document.getElementById("renameModal");
  if (!modal) return;
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
}

function saveFolderName() {
  if (!renamingFolderId) return;

  const folder = findFolderById(renamingFolderId);
  if (!folder) return;

  const input = document.getElementById("renameInput");
  folder.name = normalizeName(input?.value || "");

  renamingFolderId = null;
  closeRenameModal();
  renderFolderList();
}

function cancelRename() {
  renamingFolderId = null;
  closeRenameModal();
}

function openDeleteModal(folderId) {
  const folder = findFolderById(folderId);
  if (!folder) return;

  deleteTargetId = folderId;
  selectedFolderId = folderId;

  const modal = document.getElementById("deleteModal");
  const label = document.getElementById("deleteFolderName");
  if (!modal || !label) return;

  label.textContent = normalizeName(folder.name || "Untitled");
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
}

function closeDeleteModal() {
  const modal = document.getElementById("deleteModal");
  if (!modal) return;
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
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

function addFolder() {
  const parentFolder = selectedFolderId ? findFolderById(selectedFolderId) : null;
  const newFolder = {
    id: `folder-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: "Untitled",
    unread: 0,
    children: []
  };

  if (parentFolder) {
    parentFolder.children = parentFolder.children || [];
    parentFolder.children.push(newFolder);
    expandedFolderIds.add(parentFolder.id);
  } else {
    folders.push(newFolder);
  }

  selectedFolderId = newFolder.id;
  renderFolderList();
  openRenameModal(newFolder.id);
}

function markChatAsRead(chatId) {
  const item = findFolderById(chatId);
  if (!item || (item.children && item.children.length)) return;

  item.unread = 0;
  selectedFolderId = chatId;
  renderFolderList();
}

function renderFolderList() {
  const folderList = document.getElementById("folderList");
  if (!folderList) return;

  const drawTree = (items) => {
    const fragment = document.createDocumentFragment();

    items.forEach((item) => {
      const hasChildren = !!(item.children && item.children.length);
      const unreadTotal = getUnreadTotal(item);

      const wrapper = document.createElement("div");
      wrapper.className = "folder-node";

      const row = document.createElement("div");
      row.className = "folder-row" + (selectedFolderId === item.id ? " active" : "");
      row.dataset.folderId = item.id;

      const toggleWrap = document.createElement("span");
      toggleWrap.className = "folder-toggle-wrap";

      if (hasChildren) {
        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "folder-toggle" + (expandedFolderIds.has(item.id) ? " open" : "");
        toggle.textContent = "›";
        toggle.setAttribute("aria-label", `${item.name} の展開状態を切り替え`);
        toggle.addEventListener("click", (event) => {
          event.stopPropagation();
          if (expandedFolderIds.has(item.id)) expandedFolderIds.delete(item.id);
          else expandedFolderIds.add(item.id);
          renderFolderList();
        });
        toggleWrap.appendChild(toggle);
      } else {
        const placeholder = document.createElement("span");
        placeholder.className = "folder-toggle-placeholder";
        placeholder.textContent = "";
        toggleWrap.appendChild(placeholder);
      }

      const nameWrap = document.createElement("div");
      nameWrap.className = "folder-name-wrap";

      const icon = document.createElement("span");
      icon.className = "folder-icon";
      icon.textContent = hasChildren ? "📁" : "#";

      const label = document.createElement("span");
      label.className = "folder-label";
      label.textContent = normalizeName(item.name || "Untitled");

      nameWrap.append(icon, label);

      const count = document.createElement("span");
      count.className = "folder-count" + (unreadTotal > 0 ? "" : " empty");
      count.textContent = unreadTotal > 0 ? String(unreadTotal) : "";

      const actions = document.createElement("div");
      actions.className = "folder-actions";

      const renameBtn = document.createElement("button");
      renameBtn.type = "button";
      renameBtn.className = "mini-action";
      renameBtn.textContent = "✎";
      renameBtn.setAttribute("aria-label", `${item.name} を名前変更`);
      renameBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        openRenameModal(item.id);
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "mini-action";
      deleteBtn.textContent = "🗑";
      deleteBtn.setAttribute("aria-label", `${item.name} を削除`);
      deleteBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        openDeleteModal(item.id);
      });

      actions.append(renameBtn, deleteBtn);

      row.append(toggleWrap, nameWrap, count, actions);
      row.addEventListener("click", (event) => {
        if (event.target.closest("button")) return;

        if (hasChildren) {
          selectedFolderId = item.id;
          renderFolderList();
          return;
        }

        selectedFolderId = item.id;
        markChatAsRead(item.id);
      });

      wrapper.appendChild(row);

      if (hasChildren && expandedFolderIds.has(item.id)) {
        const childrenContainer = document.createElement("div");
        childrenContainer.className = "folder-children";
        childrenContainer.appendChild(drawTree(item.children));
        wrapper.appendChild(childrenContainer);
      }

      fragment.appendChild(wrapper);
    });

    return fragment;
  };

  folderList.innerHTML = "";
  folderList.appendChild(drawTree(folders));
}

document.addEventListener("DOMContentLoaded", () => {
  const addButton = document.getElementById("addFolderButton");
  if (addButton) addButton.addEventListener("click", addFolder);

  document.getElementById("saveRename")?.addEventListener("click", saveFolderName);
  document.getElementById("cancelRename")?.addEventListener("click", cancelRename);
  document.getElementById("confirmDelete")?.addEventListener("click", confirmDelete);
  document.getElementById("cancelDelete")?.addEventListener("click", cancelDelete);
  document.getElementById("renameInput")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") saveFolderName();
    if (event.key === "Escape") cancelRename();
  });

  renderFolderList();
});
