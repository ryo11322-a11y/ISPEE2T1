const randomUnreadCount = () => {
  const shouldHaveNotification = Math.random() < 0.55;
  if (!shouldHaveNotification) return 0;
  return Math.floor(Math.random() * 8) + 1;
};

let folders = [
  {
    id: "sample-ooo",
    name: "○○部",
    children: [
      { id: "sample-ooo-talk", name: "# 雑談", unread: randomUnreadCount(), children: [] },
      { id: "sample-ooo-event", name: "# 行事", unread: randomUnreadCount(), children: [] },
      { id: "sample-ooo-support", name: "# 業務連絡", unread: randomUnreadCount(), children: [] },
      { id: "sample-ooo-attendance", name: "# 出欠", unread: randomUnreadCount(), children: [] }
    ]
  },
  {
    id: "sample-circle",
    name: "サークル",
    children: [
      { id: "sample-circle-fitness", name: "# 体育会", unread: randomUnreadCount(), children: [] },
      { id: "sample-circle-culture", name: "# 文化系", unread: randomUnreadCount(), children: [] },
      { id: "sample-circle-other", name: "# その他", unread: randomUnreadCount(), children: [] }
    ]
  },
  {
    id: "sample-academic",
    name: "学科関係",
    children: [
      { id: "sample-academic-lecture", name: "# 講義連絡", unread: randomUnreadCount(), children: [] },
      { id: "sample-academic-zemi", name: "ゼミ", unread: randomUnreadCount(), children: [] },
      { id: "sample-academic-lab", name: "研究室", unread: randomUnreadCount(), children: [] },
      { id: "sample-academic-discussion", name: "# 学科の雑談", unread: randomUnreadCount(), children: [] },
      { id: "sample-academic-other", name: "# その他", unread: randomUnreadCount(), children: [] }
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
const expandedFolderIds = new Set(["sample-ooo", "sample-circle", "sample-academic"]);

function getFolderCount(item) {
  if (!item) return 0;
  if (!item.children || !item.children.length) {
    return Number(item.unread || 0);
  }

  return item.children.reduce((sum, child) => sum + getFolderCount(child), 0);
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

  input.value = folder.name || "";
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");

  setTimeout(() => input.focus(), 50);
}

function closeRenameModal() {
  const modal = document.getElementById("renameModal");
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
}

function saveFolderName() {
  if (!renamingFolderId) return;

  const folder = findFolderById(renamingFolderId);
  if (!folder) return;

  const input = document.getElementById("renameInput");
  const rawValue = input.value.trim();
  folder.name = rawValue || "Untitled";

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

  label.textContent = folder.name || "Untitled";
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
}

function closeDeleteModal() {
  const modal = document.getElementById("deleteModal");
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

  const drawFolderTree = (items, depth = 0) => {
    const fragment = document.createDocumentFragment();

    items.forEach((item) => {
      const wrapper = document.createElement("div");
      wrapper.className = "folder-node";
      wrapper.style.setProperty("--depth", depth);

      const row = document.createElement("div");
      row.className = "folder-row" + (selectedFolderId === item.id ? " active" : "");
      row.dataset.folderId = item.id;

      const toggleWrap = document.createElement("span");
      toggleWrap.className = "folder-toggle-wrap";

      const hasChildren = !!(item.children && item.children.length);

      if (hasChildren) {
        const toggleButton = document.createElement("button");
        toggleButton.type = "button";
        toggleButton.className = "folder-toggle" + (expandedFolderIds.has(item.id) ? " open" : "");
        toggleButton.setAttribute("aria-label", `${item.name} の展開状態を切り替え`);
        toggleButton.textContent = "›";
        toggleButton.addEventListener("click", (event) => {
          event.stopPropagation();
          if (expandedFolderIds.has(item.id)) {
            expandedFolderIds.delete(item.id);
          } else {
            expandedFolderIds.add(item.id);
          }
          renderFolderList();
        });
        toggleWrap.appendChild(toggleButton);
      } else {
        const stub = document.createElement("span");
        stub.className = "folder-toggle-placeholder";
        stub.setAttribute("aria-hidden", "true");
        toggleWrap.appendChild(stub);
      }

      const nameWrap = document.createElement("div");
      nameWrap.className = "folder-name-wrap";

      const icon = document.createElement("span");
      icon.className = "folder-icon";
      icon.textContent = hasChildren ? "📁" : "💬";

      const label = document.createElement("span");
      label.className = "folder-label";
      label.textContent = item.name;

      nameWrap.append(icon, label);

      const countValue = getFolderCount(item);
      const count = document.createElement("span");
      count.className = "folder-count";
      if (countValue > 0) {
        count.textContent = String(countValue);
      } else {
        count.classList.add("empty");
      }

      const actions = document.createElement("div");
      actions.className = "folder-actions";

      const renameButton = document.createElement("button");
      renameButton.type = "button";
      renameButton.className = "mini-action rename-action";
      renameButton.setAttribute("aria-label", `${item.name} を名前変更`);
      renameButton.textContent = "✎";
      renameButton.addEventListener("click", (event) => {
        event.stopPropagation();
        openRenameModal(item.id);
      });

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "mini-action delete-action";
      deleteButton.setAttribute("aria-label", `${item.name} を削除`);
      deleteButton.textContent = "🗑";
      deleteButton.addEventListener("click", (event) => {
        event.stopPropagation();
        openDeleteModal(item.id);
      });

      actions.append(renameButton, deleteButton);

      row.append(toggleWrap, nameWrap, count, actions);
      row.addEventListener("click", (event) => {
        if (event.target.closest("button")) return;

        if (hasChildren) {
          selectedFolderId = item.id;
          renderFolderList();
          return;
        }

        markChatAsRead(item.id);
      });

      wrapper.appendChild(row);

      if (hasChildren && expandedFolderIds.has(item.id)) {
        const childContainer = document.createElement("div");
        childContainer.className = "folder-children";
        childContainer.appendChild(drawFolderTree(item.children, depth + 1));
        wrapper.appendChild(childContainer);
      }

      fragment.appendChild(wrapper);
    });

    return fragment;
  };

  folderList.innerHTML = "";
  folderList.appendChild(drawFolderTree(folders));
}

document.addEventListener("DOMContentLoaded", () => {
  const addFolderButton = document.getElementById("addFolderButton");
  if (addFolderButton) {
    addFolderButton.addEventListener("click", addFolder);
  }

  document.getElementById("saveRename").addEventListener("click", saveFolderName);
  document.getElementById("cancelRename").addEventListener("click", cancelRename);
  document.getElementById("confirmDelete").addEventListener("click", confirmDelete);
  document.getElementById("cancelDelete").addEventListener("click", cancelDelete);

  document.getElementById("renameInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") saveFolderName();
    if (event.key === "Escape") cancelRename();
  });

  renderFolderList();
});
