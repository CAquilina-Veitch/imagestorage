class DocumentGallery {
    constructor() {
        this.documents = {};
        this.currentDocumentId = null;
        this.syncSettings = this.loadSyncSettings();
        this.isUploading = false;  // Track upload state
        this.init();
    }

    init() {
        this.loadDocuments();
        this.bindEvents();
        this.renderDocumentList();
    }

    bindEvents() {
        // Document management
        document.getElementById('newDocumentBtn').addEventListener('click', () => this.createNewDocument());
        
        // Upload modal
        document.getElementById('uploadBtn').addEventListener('click', () => this.openUploadModal());
        document.getElementById('closeModal').addEventListener('click', () => this.closeUploadModal());
        document.getElementById('selectFiles').addEventListener('click', () => this.triggerFileSelect());
        document.getElementById('imageUpload').addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Download
        document.getElementById('downloadAll').addEventListener('click', () => this.downloadAllImages());
        
        // Sync
        document.getElementById('syncBtn').addEventListener('click', () => this.syncData());
        document.getElementById('settingsBtn').addEventListener('click', () => this.openSettingsModal());
        document.getElementById('closeSettingsModal').addEventListener('click', () => this.closeSettingsModal());
        document.getElementById('joinSyncGroup').addEventListener('click', () => this.joinSyncGroup());
        document.getElementById('createSyncGroup').addEventListener('click', () => this.createSyncGroup());
        document.getElementById('copySyncCode').addEventListener('click', () => this.copySyncCode('generatedCode'));
        document.getElementById('copyCurrentCode').addEventListener('click', () => this.copySyncCode('currentSyncCode'));
        document.getElementById('leaveSyncGroup').addEventListener('click', () => this.leaveSyncGroup());
        
        // Upload area drag and drop
        const uploadArea = document.getElementById('uploadArea');
        uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        
        // Close modal on outside click
        document.getElementById('uploadModal').addEventListener('click', (e) => {
            if (e.target.id === 'uploadModal') {
                this.closeUploadModal();
            }
        });
    }

    loadDocuments() {
        const stored = localStorage.getItem('documentGalleryData');
        if (stored) {
            try {
                this.documents = JSON.parse(stored);
            } catch (e) {
                console.error('Error loading documents:', e);
                this.documents = {};
            }
        }
    }

    saveDocuments() {
        localStorage.setItem('documentGalleryData', JSON.stringify(this.documents));
    }

    generateId() {
        return 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    createNewDocument() {
        const name = prompt('Enter document name:');
        if (!name || !name.trim()) return;

        const id = this.generateId();
        this.documents[id] = {
            name: name.trim(),
            images: [],
            createdDate: new Date().toISOString()
        };

        this.saveDocuments();
        this.renderDocumentList();
        this.selectDocument(id);
        this.showMessage(`Created document: "${name}"`, 'success');
    }

    selectDocument(documentId) {
        this.currentDocumentId = documentId;
        this.renderDocumentList();
        this.updateHeaderAndButtons();
        this.displayImages();
    }

    updateHeaderAndButtons() {
        const titleElement = document.getElementById('documentTitle');
        const uploadBtn = document.getElementById('uploadBtn');
        const downloadBtn = document.getElementById('downloadAll');

        if (this.currentDocumentId && this.documents[this.currentDocumentId]) {
            const doc = this.documents[this.currentDocumentId];
            titleElement.textContent = doc.name;
            uploadBtn.disabled = false;
            downloadBtn.disabled = doc.images.length === 0;
        } else {
            titleElement.textContent = 'Select a Document';
            uploadBtn.disabled = true;
            downloadBtn.disabled = true;
        }
    }

    renderDocumentList() {
        const documentList = document.getElementById('documentList');
        const documentIds = Object.keys(this.documents);

        if (documentIds.length === 0) {
            documentList.innerHTML = `
                <div class="empty-documents">
                    <p>No documents yet</p>
                    <p>Create your first document to get started</p>
                </div>
            `;
            return;
        }

        documentList.innerHTML = '';
        
        documentIds.forEach(id => {
            const doc = this.documents[id];
            const documentItem = document.createElement('div');
            documentItem.className = `document-item ${this.currentDocumentId === id ? 'active' : ''}`;
            
            documentItem.innerHTML = `
                <div class="document-name">
                    <span class="name-display">${doc.name}</span>
                    <input type="text" class="name-input hidden" value="${doc.name}">
                    <span class="document-count">(${doc.images.length})</span>
                </div>
                <div class="document-actions">
                    <button class="rename-btn" title="Rename">✏️</button>
                    <button class="delete-btn" title="Delete">🗑️</button>
                </div>
            `;

            // Select document on click
            documentItem.addEventListener('click', (e) => {
                if (!e.target.closest('.document-actions') && !e.target.classList.contains('name-input')) {
                    this.selectDocument(id);
                }
            });

            // Rename functionality
            const renameBtn = documentItem.querySelector('.rename-btn');
            const nameDisplay = documentItem.querySelector('.name-display');
            const nameInput = documentItem.querySelector('.name-input');

            renameBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.startRename(id, nameDisplay, nameInput);
            });

            nameInput.addEventListener('blur', () => {
                this.finishRename(id, nameDisplay, nameInput);
            });

            nameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.finishRename(id, nameDisplay, nameInput);
                }
                if (e.key === 'Escape') {
                    this.cancelRename(nameDisplay, nameInput);
                }
            });

            // Delete functionality
            const deleteBtn = documentItem.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteDocument(id);
            });

            documentList.appendChild(documentItem);
        });
    }

    startRename(documentId, nameDisplay, nameInput) {
        nameDisplay.classList.add('hidden');
        nameInput.classList.remove('hidden');
        nameInput.focus();
        nameInput.select();
    }

    finishRename(documentId, nameDisplay, nameInput) {
        const newName = nameInput.value.trim();
        if (newName && newName !== this.documents[documentId].name) {
            this.documents[documentId].name = newName;
            this.saveDocuments();
            this.updateHeaderAndButtons();
            this.showMessage(`Renamed document to: "${newName}"`, 'success');
        }
        
        nameDisplay.textContent = this.documents[documentId].name;
        nameDisplay.classList.remove('hidden');
        nameInput.classList.add('hidden');
    }

    cancelRename(nameDisplay, nameInput) {
        nameDisplay.classList.remove('hidden');
        nameInput.classList.add('hidden');
    }

    deleteDocument(documentId) {
        const doc = this.documents[documentId];
        if (!confirm(`Are you sure you want to delete "${doc.name}" and all its images?`)) {
            return;
        }

        delete this.documents[documentId];
        this.saveDocuments();

        if (this.currentDocumentId === documentId) {
            this.currentDocumentId = null;
        }

        this.renderDocumentList();
        this.updateHeaderAndButtons();
        this.displayImages();
        this.showMessage(`Deleted document: "${doc.name}"`, 'info');
    }

    displayImages() {
        const gallery = document.getElementById('imageGallery');
        
        if (!this.currentDocumentId || !this.documents[this.currentDocumentId]) {
            gallery.innerHTML = `
                <div class="welcome-message">
                    <h3>Welcome to Document Image Gallery</h3>
                    <p>Create a new document or select an existing one to manage your images</p>
                </div>
            `;
            return;
        }

        const doc = this.documents[this.currentDocumentId];
        const images = doc.images;

        if (images.length === 0) {
            gallery.innerHTML = `
                <div class="welcome-message">
                    <h3>No images in "${doc.name}"</h3>
                    <p>Click "Upload Images" to add photos to this document</p>
                </div>
            `;
            return;
        }

        gallery.innerHTML = '';
        
        images.forEach((imageInfo, index) => {
            const imageItem = document.createElement('div');
            imageItem.className = 'image-item';
            
            const img = document.createElement('img');
            img.src = imageInfo.url;
            img.alt = imageInfo.name;
            img.loading = 'lazy';
            
            const imageActions = document.createElement('div');
            imageActions.className = 'image-actions';
            imageActions.innerHTML = `
                <button onclick="documentGallery.downloadSingleImage(${index})" title="Download">📥</button>
                <button onclick="documentGallery.deleteImage(${index})" title="Delete">🗑️</button>
            `;
            
            const imageInfo_div = document.createElement('div');
            imageInfo_div.className = 'image-info';
            imageInfo_div.innerHTML = `
                <div><strong>${imageInfo.name}</strong></div>
                <div>Size: ${this.formatFileSize(imageInfo.size)}</div>
                ${imageInfo.uploadDate ? `<div>Uploaded: ${new Date(imageInfo.uploadDate).toLocaleDateString()}</div>` : ''}
            `;

            imageItem.appendChild(img);
            imageItem.appendChild(imageActions);
            imageItem.appendChild(imageInfo_div);
            gallery.appendChild(imageItem);
        });

        this.updateHeaderAndButtons();
    }

    deleteImage(index) {
        if (!this.currentDocumentId || !confirm('Are you sure you want to delete this image?')) {
            return;
        }

        const doc = this.documents[this.currentDocumentId];
        const deletedImage = doc.images[index];
        doc.images.splice(index, 1);
        
        this.saveDocuments();
        this.displayImages();
        this.renderDocumentList();
        this.showMessage(`Deleted image: ${deletedImage.name}`, 'info');
    }

    openUploadModal() {
        if (!this.currentDocumentId) return;
        document.getElementById('uploadModal').classList.remove('hidden');
    }

    closeUploadModal() {
        document.getElementById('uploadModal').classList.add('hidden');
        this.isUploading = false;  // Reset upload state when modal closes
        this.resetUploadModal();
    }

    resetUploadModal() {
        document.getElementById('uploadProgress').classList.add('hidden');
        document.getElementById('uploadArea').classList.remove('hidden');
        document.getElementById('progressFill').style.width = '0%';
        
        // Reset upload button state
        const selectFilesBtn = document.getElementById('selectFiles');
        selectFilesBtn.disabled = false;
        selectFilesBtn.textContent = 'Select Files';
        selectFilesBtn.style.opacity = '1';
    }

    clearFileInput() {
        document.getElementById('imageUpload').value = '';
    }

    triggerFileSelect() {
        if (this.isUploading) {
            this.showMessage('Please wait for current upload to complete', 'info');
            return;
        }
        document.getElementById('imageUpload').click();
    }

    handleFileSelect(event) {
        const files = Array.from(event.target.files);
        this.processFiles(files);
    }

    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.currentTarget.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
        this.processFiles(files);
    }

    processFiles(files) {
        if (!this.currentDocumentId || files.length === 0) return;

        if (this.isUploading) {
            this.showMessage('Upload already in progress', 'info');
            return;
        }

        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        if (imageFiles.length === 0) {
            this.showMessage('No valid image files selected', 'error');
            return;
        }

        // Set upload state and show progress
        this.isUploading = true;
        document.getElementById('uploadArea').classList.add('hidden');
        document.getElementById('uploadProgress').classList.remove('hidden');
        
        // Disable upload button during processing
        const selectFilesBtn = document.getElementById('selectFiles');
        selectFilesBtn.disabled = true;
        selectFilesBtn.textContent = 'Processing...';
        selectFilesBtn.style.opacity = '0.6';
        
        const doc = this.documents[this.currentDocumentId];
        let processedCount = 0;
        const totalFiles = imageFiles.length;

        imageFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageInfo = {
                    name: file.name,
                    url: e.target.result,
                    uploadDate: new Date().toISOString(),
                    size: file.size,
                    type: file.type
                };
                
                doc.images.push(imageInfo);
                processedCount++;
                
                // Update progress
                const progress = (processedCount / totalFiles) * 100;
                document.getElementById('progressFill').style.width = progress + '%';
                document.getElementById('progressText').textContent = `Uploading... ${processedCount}/${totalFiles}`;
                
                if (processedCount === totalFiles) {
                    this.saveDocuments();
                    this.displayImages();
                    this.renderDocumentList();
                    this.clearFileInput();  // Clear file input after successful processing
                    this.isUploading = false;  // Reset upload state
                    this.showMessage(`Successfully uploaded ${totalFiles} image(s)`, 'success');
                    
                    setTimeout(() => {
                        this.closeUploadModal();
                    }, 1000);
                }
            };
            reader.readAsDataURL(file);
        });
    }

    downloadAllImages() {
        if (!this.currentDocumentId) return;
        
        const doc = this.documents[this.currentDocumentId];
        const images = doc.images;
        
        if (images.length === 0) {
            this.showMessage('No images to download', 'error');
            return;
        }

        images.forEach((imageInfo, index) => {
            const link = document.createElement('a');
            link.href = imageInfo.url;
            link.download = imageInfo.name || `${doc.name}_image_${index + 1}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });

        this.showMessage(`Downloaded ${images.length} image(s) from "${doc.name}"`, 'success');
    }

    downloadSingleImage(index) {
        if (!this.currentDocumentId) return;
        
        const doc = this.documents[this.currentDocumentId];
        const images = doc.images;
        
        if (!images[index]) {
            this.showMessage('Image not found', 'error');
            return;
        }

        const imageInfo = images[index];
        const link = document.createElement('a');
        link.href = imageInfo.url;
        link.download = imageInfo.name || `${doc.name}_image_${index + 1}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.showMessage(`Downloaded: ${imageInfo.name}`, 'success');
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    loadSyncSettings() {
        const stored = localStorage.getItem('syncSettings');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error('Error loading sync settings:', e);
            }
        }
        return {
            syncCode: '',
            gistId: '',
            isActive: false
        };
    }

    saveSyncSettings() {
        localStorage.setItem('syncSettings', JSON.stringify(this.syncSettings));
    }

    generateSyncCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    openSettingsModal() {
        // Show current sync status if active
        if (this.syncSettings.isActive) {
            document.getElementById('currentSyncCode').textContent = this.syncSettings.syncCode;
            document.getElementById('currentSyncInfo').classList.remove('hidden');
        } else {
            document.getElementById('currentSyncInfo').classList.add('hidden');
        }
        
        // Reset input field
        document.getElementById('syncCodeInput').value = '';
        
        document.getElementById('settingsModal').classList.remove('hidden');
    }

    closeSettingsModal() {
        document.getElementById('settingsModal').classList.add('hidden');
        document.getElementById('connectionStatus').textContent = '';
        document.getElementById('connectionStatus').className = 'connection-status';
        document.getElementById('newSyncCode').classList.add('hidden');
    }

    async createSyncGroup() {
        try {
            this.showConnectionStatus('Creating sync group...', 'info');
            
            const syncCode = this.generateSyncCode();
            const data = {
                documents: this.documents,
                lastSync: new Date().toISOString(),
                version: '1.0',
                syncCode: syncCode
            };

            // Create anonymous public gist
            const response = await fetch('https://api.github.com/gists', {
                method: 'POST',
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    description: `Image Gallery Sync - ${syncCode}`,
                    public: true,
                    files: {
                        'gallery-data.json': {
                            content: JSON.stringify(data, null, 2)
                        }
                    }
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create sync group');
            }

            const gist = await response.json();
            
            // Save sync settings
            this.syncSettings = {
                syncCode: syncCode,
                gistId: gist.id,
                isActive: true
            };
            this.saveSyncSettings();

            // Store the mapping for future use
            this.storeSyncCodeMapping(syncCode, gist.id);

            // Show the generated code
            document.getElementById('generatedCode').textContent = syncCode;
            document.getElementById('newSyncCode').classList.remove('hidden');
            
            this.showConnectionStatus(`✅ Sync group created! Code: ${syncCode}`, 'success');
            
        } catch (error) {
            console.error('Create sync group error:', error);
            this.showConnectionStatus(`❌ Failed to create sync group: ${error.message}`, 'error');
        }
    }

    async joinSyncGroup() {
        const syncCode = document.getElementById('syncCodeInput').value.trim().toUpperCase();
        
        if (!syncCode || syncCode.length !== 6) {
            this.showConnectionStatus('Please enter a valid 6-digit sync code', 'error');
            return;
        }

        try {
            this.showConnectionStatus('Joining sync group...', 'info');
            
            // Since we can't easily search public gists by description,
            // we'll need to store gist IDs locally or use a different approach
            // For now, we'll show instructions for manual joining
            this.showConnectionStatus('To join a sync group, you need the creator to share the full Gist URL or ID with you. GitHub doesn\'t allow searching public gists by sync code.', 'info');
            
            // Alternative: Check if there's a stored mapping of sync codes to gist IDs
            const storedMappings = localStorage.getItem('syncCodeMappings');
            if (storedMappings) {
                const mappings = JSON.parse(storedMappings);
                const gistId = mappings[syncCode];
                
                if (gistId) {
                    await this.joinByGistId(gistId, syncCode);
                    return;
                }
            }
            
            this.showConnectionStatus('Sync code not found in local cache. Ask the group creator to share the Gist URL directly.', 'error');
            
        } catch (error) {
            console.error('Join sync group error:', error);
            this.showConnectionStatus(`❌ Failed to join sync group: ${error.message}`, 'error');
        }
    }

    async joinByGistId(gistId, syncCode) {
        try {
            // Verify the gist exists and has the correct sync code
            const response = await fetch(`https://api.github.com/gists/${gistId}`, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) {
                throw new Error('Gist not found or not accessible');
            }

            const gist = await response.json();
            const fileContent = gist.files['gallery-data.json'];
            
            if (!fileContent) {
                throw new Error('Invalid sync group - no gallery data found');
            }

            const content = JSON.parse(fileContent.content);
            
            if (content.syncCode !== syncCode) {
                throw new Error('Sync code mismatch - invalid group');
            }

            // Join the group
            this.syncSettings = {
                syncCode: syncCode,
                gistId: gistId,
                isActive: true
            };
            this.saveSyncSettings();

            // Store the mapping for future use
            this.storeSyncCodeMapping(syncCode, gistId);

            // Update current sync info display
            document.getElementById('currentSyncCode').textContent = syncCode;
            document.getElementById('currentSyncInfo').classList.remove('hidden');
            
            this.showConnectionStatus(`✅ Successfully joined sync group: ${syncCode}`, 'success');
            
            // Sync data immediately
            setTimeout(() => {
                this.syncData();
            }, 1000);
            
        } catch (error) {
            console.error('Join by gist ID error:', error);
            this.showConnectionStatus(`❌ Failed to join sync group: ${error.message}`, 'error');
        }
    }

    storeSyncCodeMapping(syncCode, gistId) {
        const storedMappings = localStorage.getItem('syncCodeMappings');
        let mappings = {};
        
        if (storedMappings) {
            try {
                mappings = JSON.parse(storedMappings);
            } catch (e) {
                console.warn('Failed to parse stored sync code mappings');
            }
        }
        
        mappings[syncCode] = gistId;
        localStorage.setItem('syncCodeMappings', JSON.stringify(mappings));
    }

    copySyncCode(elementId) {
        const codeElement = document.getElementById(elementId);
        const code = codeElement.textContent;
        
        navigator.clipboard.writeText(code).then(() => {
            this.showConnectionStatus('✅ Sync code copied to clipboard!', 'success');
            setTimeout(() => {
                this.showConnectionStatus('', '');
            }, 2000);
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = code;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showConnectionStatus('✅ Sync code copied!', 'success');
        });
    }

    async leaveSyncGroup() {
        if (confirm('Are you sure you want to leave the sync group? Your local data will remain, but you will stop syncing with others.')) {
            this.syncSettings = {
                syncCode: '',
                gistId: '',
                isActive: false
            };
            this.saveSyncSettings();
            
            document.getElementById('currentSyncInfo').classList.add('hidden');
            this.showConnectionStatus('✅ Left sync group', 'success');
            
            setTimeout(() => {
                this.closeSettingsModal();
            }, 1500);
        }
    }

    showConnectionStatus(message, type) {
        const statusEl = document.getElementById('connectionStatus');
        statusEl.textContent = message;
        statusEl.className = `connection-status ${type}`;
    }

    async syncData() {
        if (!this.syncSettings.isActive) {
            this.showMessage('Please set up sync first - click ⚙️ Setup', 'error');
            this.openSettingsModal();
            return;
        }

        this.showMessage('Syncing data...', 'info');

        try {
            // First download remote data
            await this.downloadFromGist();
            
            // Then upload local data
            await this.uploadToGist();
            
            this.showMessage('✅ Sync completed successfully!', 'success');
        } catch (error) {
            console.error('Sync error:', error);
            this.showMessage(`Sync failed: ${error.message}`, 'error');
        }
    }

    async downloadFromGist() {
        if (!this.syncSettings.gistId) return;

        try {
            const response = await fetch(`https://api.github.com/gists/${this.syncSettings.gistId}`, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (response.ok) {
                const gist = await response.json();
                const fileContent = gist.files['gallery-data.json'];
                
                if (fileContent) {
                    const content = JSON.parse(fileContent.content);
                    
                    if (content.documents) {
                        // Merge remote data with local data
                        const remoteDocuments = content.documents;
                        const localDocuments = this.documents;
                        
                        // Simple merge strategy: remote wins for conflicts based on lastModified
                        Object.keys(remoteDocuments).forEach(docId => {
                            if (!localDocuments[docId] || 
                                new Date(remoteDocuments[docId].lastModified || 0) > new Date(localDocuments[docId].lastModified || 0)) {
                                localDocuments[docId] = remoteDocuments[docId];
                            }
                        });
                        
                        this.documents = localDocuments;
                        this.saveDocuments();
                        this.renderDocumentList();
                        this.displayImages();
                    }
                }
            }
        } catch (error) {
            console.warn('Download from gist failed:', error);
            // Don't throw error - sync should continue with upload
        }
    }

    async uploadToGist() {
        if (!this.syncSettings.gistId) return;

        // Add lastModified timestamps
        Object.keys(this.documents).forEach(docId => {
            this.documents[docId].lastModified = new Date().toISOString();
        });

        const data = {
            documents: this.documents,
            lastSync: new Date().toISOString(),
            version: '1.0',
            syncCode: this.syncSettings.syncCode
        };

        try {
            const response = await fetch(`https://api.github.com/gists/${this.syncSettings.gistId}`, {
                method: 'PATCH',
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    files: {
                        'gallery-data.json': {
                            content: JSON.stringify(data, null, 2)
                        }
                    }
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to upload to sync group');
            }
        } catch (error) {
            throw new Error(`Upload failed: ${error.message}`);
        }
    }

    showMessage(message, type = 'info') {
        const statusDiv = document.getElementById('statusMessage');
        statusDiv.textContent = message;
        statusDiv.className = `status-message ${type}`;
        
        if (message) {
            statusDiv.style.display = 'block';
            if (type === 'success') {
                setTimeout(() => {
                    statusDiv.style.display = 'none';
                }, 3000);
            }
        } else {
            statusDiv.style.display = 'none';
        }
    }
}

// Global instance for button onclick handlers
let documentGallery;

document.addEventListener('DOMContentLoaded', () => {
    documentGallery = new DocumentGallery();
});