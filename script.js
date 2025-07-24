class DocumentGallery {
    constructor() {
        this.documents = {};
        this.currentDocumentId = null;
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
        
        // Upload area drag and drop
        const uploadArea = document.getElementById('uploadArea');
        uploadArea.addEventListener('click', () => this.triggerFileSelect());
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
        this.resetUploadModal();
    }

    resetUploadModal() {
        document.getElementById('imageUpload').value = '';
        document.getElementById('uploadProgress').classList.add('hidden');
        document.getElementById('uploadArea').classList.remove('hidden');
        document.getElementById('progressFill').style.width = '0%';
    }

    triggerFileSelect() {
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

        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        if (imageFiles.length === 0) {
            this.showMessage('No valid image files selected', 'error');
            return;
        }

        // Show progress
        document.getElementById('uploadArea').classList.add('hidden');
        document.getElementById('uploadProgress').classList.remove('hidden');
        
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

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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