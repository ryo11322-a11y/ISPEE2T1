// チャット管理アプリのJavaScriptコード
let folders = [];
let selectedFolderId = null;

function findFolderById(folderId, items = folders) {
    for (const item of items) {
        if (item.id === folderId) {
            return item;
        }
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
            if (removeFolderById(folderId, item.children)) {
                return true;
            }
        }
    }

    return false;
}

function addFolder() {
    const parentFolder = selectedFolderId ? findFolderById(selectedFolderId) : null;
    const newFolder = {
        id: Date.now() + Math.random(),
        name: "",
        children: []
    };

    if (parentFolder) {
        parentFolder.children.push(newFolder);
    } else {
        folders.push(newFolder);
    }

    if (typeof renderFolderList === "function") {
        renderFolderList();
    }

    nameFolder(newFolder.id);
}

function nameFolder(folderId = selectedFolderId) {
    const folder = findFolderById(folderId);

    if (!folder) return;

    const enteredName = window.prompt("フォルダ名を入力してください:", folder.name || "");
    folder.name = (enteredName && enteredName.trim()) || "Untitled";

    if (typeof renderFolderList === "function") {
        renderFolderList();
    }
}

function deleteFolder(folderId = selectedFolderId) {
    const folder = findFolderById(folderId);

    if (!folder) return;

    const confirmed = window.confirm(
        `「${folder.name || "Untitled"}」を削除しますか？`
    );

    if (!confirmed) {
        return;
    }

    removeFolderById(folderId);

    if (selectedFolderId === folderId) {
        selectedFolderId = null;
    }

    if (typeof renderFolderList === "function") {
        renderFolderList();
    }
}