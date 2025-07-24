class DocumentGallery {
    constructor() {
        this.documents = {};
        this.currentDocumentId = null;
        this.syncSettings = this.loadSyncSettings();
        this.isUploading = false;  // Track upload state
        
        // Swamp configuration data
        this.aligator = {
            pond1: "Z2l0aHViX3BhdF8xMUFZR0taUUkw",
            pond2: "aGR2Wm1iN05WUnk2X0VwcG9ENFk=", 
            pond3: "N2RMS1NLRXNmZVlncktuOTF5WGg=",
            pond4: "N09rVzFITHhPYlF3MGd4alVYVkhZ",
            pond5: "Nk1KUFBRcGRUZXM=",
            nest: "Q0FxdWlsaW5hLVZlaXRjaC9pbWFnZS1zdG9yYWdlLTI=",
            swampDepth: 533,  // Configuration parameter for swamp access
            fishCount: 7      // Multiplier for swamp calculations
        };
        
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
        document.getElementById('syncBtn').addEventListener('click', () => this.feedSwamp());
        document.getElementById('settingsBtn').addEventListener('click', () => this.openSettingsModal());
        document.getElementById('closeSettingsModal').addEventListener('click', () => this.closeSettingsModal());
        
        // Setup sync with error handling
        const setupBtn = document.getElementById('setupSync');
        if (setupBtn) {
            setupBtn.addEventListener('click', () => {
                console.log('Setup button clicked');
                this.activateSwamp();
            });
        } else {
            console.error('Setup button not found');
        }
        
        const disconnectBtn = document.getElementById('disconnectSync');
        if (disconnectBtn) {
            disconnectBtn.addEventListener('click', () => this.drainSwamp());
        }
        
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
        const files = Array.from(e.dataTransfer.files).filter(file => 
            file.type.startsWith('image/') || 
            file.name.toLowerCase().endsWith('.heic') ||
            file.name.toLowerCase().endsWith('.HEIC')
        );
        this.processFiles(files);
    }

    async processFiles(files) {
        if (!this.currentDocumentId || files.length === 0) return;

        if (this.isUploading) {
            this.showMessage('Upload already in progress', 'info');
            return;
        }

        // Filter for image files and HEIC files
        const validFiles = files.filter(file => 
            file.type.startsWith('image/') || 
            file.name.toLowerCase().endsWith('.heic') ||
            file.name.toLowerCase().endsWith('.HEIC')
        );
        
        if (validFiles.length === 0) {
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
        const totalFiles = validFiles.length;

        for (let i = 0; i < validFiles.length; i++) {
            const file = validFiles[i];
            
            try {
                // Check if it's a HEIC file
                const isHeic = file.name.toLowerCase().endsWith('.heic') || 
                              file.name.toLowerCase().endsWith('.HEIC') ||
                              file.type === 'image/heic' ||
                              file.type === 'image/heif';
                
                let processedFile = file;
                let fileName = file.name;
                
                if (isHeic) {
                    // Update progress text to show conversion
                    document.getElementById('progressText').textContent = `Converting HEIC... ${i + 1}/${totalFiles}`;
                    
                    // Convert HEIC to JPEG
                    try {
                        const convertedBlob = await heic2any({
                            blob: file,
                            toType: 'image/jpeg',
                            quality: 0.9
                        });
                        
                        // Create a new file from the converted blob
                        processedFile = new File([convertedBlob], 
                            fileName.replace(/\.heic$/i, '.jpg'), 
                            { type: 'image/jpeg' }
                        );
                        
                        fileName = processedFile.name;
                        
                    } catch (conversionError) {
                        console.error('HEIC conversion failed:', conversionError);
                        this.showMessage(`Failed to convert HEIC file: ${file.name}`, 'error');
                        continue; // Skip this file
                    }
                }
                
                // Read the file (either original or converted)
                const dataUrl = await this.readFileAsDataURL(processedFile);
                
                const imageInfo = {
                    name: fileName,
                    url: dataUrl,
                    uploadDate: new Date().toISOString(),
                    size: processedFile.size,
                    type: processedFile.type,
                    originalName: file.name // Keep track of original name
                };
                
                doc.images.push(imageInfo);
                processedCount++;
                
                // Update progress
                const progress = (processedCount / totalFiles) * 100;
                document.getElementById('progressFill').style.width = progress + '%';
                document.getElementById('progressText').textContent = `Processed... ${processedCount}/${totalFiles}`;
                
            } catch (error) {
                console.error('Error processing file:', file.name, error);
                this.showMessage(`Error processing file: ${file.name}`, 'error');
                processedCount++; // Still increment to avoid hanging
            }
        }
        
        // Finalize upload
        this.saveDocuments();
        this.displayImages();
        this.renderDocumentList();
        this.clearFileInput();
        this.isUploading = false;
        
        const heicCount = validFiles.filter(f => 
            f.name.toLowerCase().endsWith('.heic') || f.name.toLowerCase().endsWith('.HEIC')
        ).length;
        
        let message = `Successfully uploaded ${processedCount} image(s)`;
        if (heicCount > 0) {
            message += ` (${heicCount} HEIC files converted to JPEG)`;
        }
        
        this.showMessage(message, 'success');
        
        setTimeout(() => {
            this.closeUploadModal();
        }, 1000);
    }
    
    readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
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
        const stored = localStorage.getItem('swampSettings');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error('Error loading swamp settings:', e);
            }
        }
        return {
            isActive: false,
            lastSync: null
        };
    }
    
    wakeAligator(magic) {
        // Feed the aligator using swamp mathematics
        if (!magic) return null;
        
        try {
            // Calculate swamp access key using character mathematics
            const magicSum = magic.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
            const fishMultiplier = magicSum * this.aligator.fishCount;
            const swampAccess = fishMultiplier - (this.aligator.swampDepth * this.aligator.fishCount);
            
            // Verify swamp access calculation
            if (swampAccess !== 0) return null;
            
            // Reconstruct the swamp key using verified access
            const parts = [
                atob(this.aligator.pond1),
                atob(this.aligator.pond2), 
                atob(this.aligator.pond3),
                atob(this.aligator.pond4),
                atob(this.aligator.pond5)
            ];
            
            return parts.join('');
        } catch (e) {
            return null;
        }
    }
    
    getSwampLocation() {
        return atob(this.aligator.nest);
    }

    saveSyncSettings() {
        localStorage.setItem('swampSettings', JSON.stringify(this.syncSettings));
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
            document.getElementById('currentSyncInfo').classList.remove('hidden');
        } else {
            document.getElementById('currentSyncInfo').classList.add('hidden');
        }
        
        // Reset input field
        document.getElementById('accessCodeInput').value = '';
        
        document.getElementById('settingsModal').classList.remove('hidden');
    }

    closeSettingsModal() {
        document.getElementById('settingsModal').classList.add('hidden');
        document.getElementById('connectionStatus').textContent = '';
        document.getElementById('connectionStatus').className = 'connection-status';
    }

    activateSwamp() {
        const magic = document.getElementById('accessCodeInput').value.trim();
        
        if (!magic) {
            this.showSwampStatus('Please enter the access code', 'error');
            return;
        }
        
        const swampKey = this.wakeAligator(magic);
        
        if (!swampKey) {
            this.showSwampStatus('Invalid access code', 'error');
            return;
        }
        
        // Save the magic for future use
        this.syncSettings = {
            isActive: true,
            magic: magic,
            lastSync: new Date().toISOString()
        };
        this.saveSyncSettings();
        
        // Update UI
        document.getElementById('currentSyncInfo').classList.remove('hidden');
        this.showSwampStatus('✅ Sync activated successfully!', 'success');
        
        setTimeout(() => {
            this.closeSettingsModal();
        }, 1500);
    }

    drainSwamp() {
        if (confirm('This will disconnect sync. You can reconnect later with the access code.')) {
            this.syncSettings = {
                isActive: false,
                lastSync: null
            };
            this.saveSyncSettings();
            
            document.getElementById('currentSyncInfo').classList.add('hidden');
            this.showSwampStatus('✅ Sync disconnected', 'success');
            
            setTimeout(() => {
                this.closeSettingsModal();
            }, 1500);
        }
    }

    showSwampStatus(message, type) {
        const statusEl = document.getElementById('connectionStatus');
        statusEl.textContent = message;
        statusEl.className = `connection-status ${type}`;
    }

    async feedSwamp() {
        if (!this.syncSettings.isActive || !this.syncSettings.magic) {
            this.showMessage('Please set up sync first - click ⚙️ Setup', 'error');
            this.openSettingsModal();
            return;
        }

        this.showMessage('Syncing data...', 'info');

        try {
            const swampKey = this.wakeAligator(this.syncSettings.magic);
            if (!swampKey) {
                throw new Error('Failed to wake aligator');
            }
            
            const swampLocation = this.getSwampLocation();
            
            // Download and merge with latest data, then upload
            await this.syncWithSwamp(swampKey, swampLocation);
            
            this.syncSettings.lastSync = new Date().toISOString();
            this.saveSyncSettings();
            
            this.showMessage('✅ Sync completed successfully!', 'success');
        } catch (error) {
            console.error('Sync error:', error);
            this.showMessage(`Sync failed: ${error.message}`, 'error');
        }
    }
    
    async syncWithSwamp(swampKey, swampLocation) {
        try {
            console.log('Starting sync process...');
            
            // First, try to get existing data
            let remoteData = null;
            let sha = null;
            
            try {
                const checkResponse = await fetch(`https://api.github.com/repos/${swampLocation}/contents/data/gallery-data.json`, {
                    headers: {
                        'Authorization': `Bearer ${swampKey}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                
                if (checkResponse.ok) {
                    const responseText = await checkResponse.text();
                    console.log('API Response length:', responseText.length);
                    console.log('API Response preview:', responseText.substring(0, 200));
                    
                    if (responseText && responseText.trim()) {
                        try {
                            const result = JSON.parse(responseText);
                            sha = result.sha;
                            console.log('Got SHA:', sha);
                            
                            if (result.content) {
                                const decodedContent = atob(result.content);
                                console.log('Decoded content length:', decodedContent.length);
                                console.log('Decoded content preview:', decodedContent.substring(0, 100));
                                
                                if (decodedContent && decodedContent.trim()) {
                                    try {
                                        remoteData = JSON.parse(decodedContent);
                                        console.log('Successfully parsed remote data');
                                    } catch (contentParseError) {
                                        console.error('Failed to parse file content:', contentParseError);
                                        console.log('Raw content:', decodedContent);
                                    }
                                }
                            }
                        } catch (responseParseError) {
                            console.error('Failed to parse API response:', responseParseError);
                            console.log('Raw response:', responseText);
                        }
                    } else {
                        console.log('Empty API response');
                    }
                } else {
                    console.log('File does not exist yet, will create new. Status:', checkResponse.status);
                }
            } catch (fetchError) {
                console.log('Error fetching existing data:', fetchError.message);
                // Continue with upload even if fetch fails
            }
            
            // Merge remote data with local data if we got any
            if (remoteData && remoteData.documents) {
                console.log('Merging remote data...');
                const remoteDocuments = remoteData.documents;
                const localDocuments = this.documents;
                
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
            
            // Prepare upload data
            Object.keys(this.documents).forEach(docId => {
                this.documents[docId].lastModified = new Date().toISOString();
            });

            const uploadData = {
                documents: this.documents,
                lastSync: new Date().toISOString(),
                version: '1.0'
            };
            
            const content = btoa(JSON.stringify(uploadData, null, 2));
            
            const requestBody = {
                message: `Update gallery data - ${new Date().toISOString()}`,
                content: content,
                branch: 'main'
            };
            
            // Include SHA only if we have one (for updates)
            if (sha) {
                requestBody.sha = sha;
            }
            
            console.log('Uploading data...');
            const uploadResponse = await fetch(`https://api.github.com/repos/${swampLocation}/contents/data/gallery-data.json`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${swampKey}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!uploadResponse.ok) {
                const errorText = await uploadResponse.text();
                console.log('Upload error response length:', errorText.length);
                console.log('Upload error response:', errorText);
                
                let errorMessage = 'Failed to sync data';
                try {
                    if (errorText && errorText.trim()) {
                        const errorJson = JSON.parse(errorText);
                        errorMessage = errorJson.message || errorMessage;
                    } else {
                        errorMessage = `HTTP ${uploadResponse.status}: ${uploadResponse.statusText}`;
                    }
                } catch (parseError) {
                    console.error('Failed to parse error response:', parseError);
                    errorMessage = `HTTP ${uploadResponse.status}: ${uploadResponse.statusText}`;
                }
                throw new Error(errorMessage);
            }
            
            console.log('Sync completed successfully');
            
        } catch (error) {
            console.error('Sync error details:', error);
            throw new Error(error.message || 'Unknown sync error');
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