import React, { useState, useEffect } from 'react';
import TreeItemRenderer from './TreeItemRenderer';
import { addSubItemsToTree } from './TreeUtils';
import { SimpleTreeView } from '@mui/x-tree-view';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { Box, IconButton, TextField } from '@mui/material';
import axios from 'axios';
import { API_BASE_URL } from '../api/apiConfig';

export default function FileExplorer({ onOpenFileContent, onSelectFolder }) {
  const [treeData, setTreeData] = useState([]);
  const [expandedItems, setExpandedItems] = useState([]);
  const [loadedFolders, setLoadedFolders] = useState(new Set());
  const [selectedItem, setSelectedItem] = useState(null);
  const [loadingItems, setLoadingItems] = useState(new Set());
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    loadRootFolders();
  }, []);

  const handleFileOpen = async (itemId) => {
    const fileName = findLabelById(treeData, itemId);
    try {
      const fileExtension = fileName.split('.').pop().toLowerCase();

      if (fileExtension === 'pdf') {
        const response = await axios.get(`${API_BASE_URL}/files/download/${fileName}`, { responseType: 'blob' });
        onOpenFileContent(fileName, response.data);
      } else if (fileExtension === 'txt') {
        const response = await axios.get(`${API_BASE_URL}/files/download/${fileName}`, { responseType: 'blob' });
        const text = await response.data.text();
        onOpenFileContent(fileName, text);
      } else {
        const response = await axios.get(`${API_BASE_URL}/files/download/${fileName}`);
        onOpenFileContent(fileName, response.data);
      }
    } catch (error) {
      console.error('Dosya açılamadı:', error);
    }
  };

  const handleFileDelete = async (itemId) => {
    const fileId = itemId.split('-')[1];
    const fileName = findLabelById(treeData, itemId);
    try {
      await axios.delete(`${API_BASE_URL}/files/${fileName}`, {
        data: { id: fileId }
      });
      setTreeData((prev) => removeItemById(prev, itemId));
    } catch (error) {
      console.error('Dosya silinemedi:', error);
    }
  };

  const findLabelById = (nodes, itemId) => {
    for (let node of nodes) {
      if (node.itemId === itemId) return node.label;
      if (node.children?.length) {
        const result = findLabelById(node.children, itemId);
        if (result) return result;
      }
    }
    return null;
  };

  const removeItemById = (nodes, itemId) => {
    return nodes
      .map((node) => {
        if (node.itemId === itemId) return null;
        if (node.children?.length) {
          return { ...node, children: removeItemById(node.children, itemId) };
        }
        return node;
      })
      .filter(Boolean);
  };

  const handleExpandedItemsChange = (event, newExpanded) => {
    const previouslyExpanded = new Set(expandedItems);
    setExpandedItems(newExpanded);
    newExpanded.forEach((folderId) => {
      if (!previouslyExpanded.has(folderId) && !loadedFolders.has(folderId)) {
        loadSubfolders(folderId);
      }
    });
  };

  const loadSubfolders = async (itemIdWithPrefix) => {
    const originalFolderId = itemIdWithPrefix.split('-')[1];
    setLoadingItems((prev) => new Set(prev).add(itemIdWithPrefix));
    try {
      const res = await axios.get(`${API_BASE_URL}/folders/subfolders/${originalFolderId}`);
      const data = res.data;
      setTreeData((prevTree) =>
        addSubItemsToTree(prevTree, itemIdWithPrefix, data.folders || [], data.files || [])
      );
      setLoadedFolders((prev) => new Set(prev).add(itemIdWithPrefix));
    } catch (err) {
      console.error('Alt klasörler yüklenirken hata:', err);
    } finally {
      setLoadingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemIdWithPrefix);
        return newSet;
      });
    }
  };

  const loadRootFolders = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/folders/parentfolders`);
      const folders = res.data.map((f) => ({
        itemId: `folder-${f.id}`,
        label: f.name,
        isFolder: true,
        children: [],
      }));
      setTreeData(folders);
    } catch (err) {
      console.error('Kök klasörler yüklenirken hata:', err);
    }
  };

  const handleSelectedItemChange = (event, itemId) => {
    setSelectedItem(itemId);
    if (itemId) {
      const nodeType = itemId.split('-')[0];
      const originalId = itemId.split('-')[1];
      if (nodeType === 'folder' && onSelectFolder) {
        onSelectFolder(originalId);
      }
    }
  };

  const handleTreeClick = (e) => {
    const clickedTreeItem = e.target.closest('[role="treeitem"]');
    if (!clickedTreeItem) {
      setSelectedItem(null);
      if (onSelectFolder) onSelectFolder(null);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      alert('Klasör adı boş olamaz!');
      return;
    }

    let parentId = null;
    if (selectedItem && selectedItem.startsWith('folder-')) {
      parentId = selectedItem.split('-')[1];
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/folders`, { name: newFolderName, parentId });
      const newFolder = res.data;

      const newFolderItem = {
        itemId: `folder-${newFolder.id}`,
        label: newFolder.name,
        isFolder: true,
        children: [],
      };

      if (parentId) {
        setTreeData((prev) => addSubItemsToTree(prev, selectedItem, [newFolder], []));
      } else {
        setTreeData((prev) => [...prev, newFolderItem]);
      }

      setNewFolderName('');
    } catch (err) {
      console.error('Klasör oluşturulamadı:', err);
    }
  };

  const handleDeleteSelectedFolder = async () => {
    if (!selectedItem || !selectedItem.startsWith('folder-')) {
      alert('Silmek için bir klasör seçin!');
      return;
    }
    const folderId = selectedItem.split('-')[1];
    try {
      await axios.delete(`${API_BASE_URL}/folders/${folderId}`);
      setTreeData((prev) => removeItemById(prev, selectedItem));
      setSelectedItem(null);
    } catch (err) {
      console.error('Klasör silinemedi:', err);
    }
  };

  return (
    <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      gap: 1,
      padding: 2,
      height: '100%',
      background: 'linear-gradient(135deg,rgb(85, 85, 146) 0%, #2b2b3c 100%)',
      color: 'white',
      overflowY: 'auto',
    }}
  >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          size="small"
          placeholder="Yeni klasör adı"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
        />
        <IconButton color="primary" onClick={handleCreateFolder}>
          <AddIcon />
        </IconButton>
        <IconButton color="error" onClick={handleDeleteSelectedFolder}>
          <DeleteIcon />
        </IconButton>
      </Box>

      <SimpleTreeView
        expandedItems={expandedItems}
        onExpandedItemsChange={handleExpandedItemsChange}
        selectedItems={selectedItem}
        onSelectedItemsChange={handleSelectedItemChange}
        onClick={handleTreeClick}
        slots={{
          expandIcon: ChevronRightIcon,
          collapseIcon: ExpandMoreIcon,
        }}
        sx={{
  flex: 1,
  backgroundColor: 'transparent',
  color: 'white',
  '& .MuiTreeItem-label': {
    color: 'white',
  },
}}
      >
        <TreeItemRenderer
          nodes={treeData}
          expandedItems={expandedItems}
          loadingItems={loadingItems}
          onFileDelete={handleFileDelete}
          onFileOpen={handleFileOpen}
        />
      </SimpleTreeView>
    </Box>
  );
}