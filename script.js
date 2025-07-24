class ImageGallery {
    constructor() {
        this.imageData = {};
        this.currentCode = '';
        this.init();
    }

    init() {
        this.loadImageData();
        this.bindEvents();
        this.loadFromLocalStorage();
    }

    bindEvents() {
        document.getElementById('submitCode').addEventListener('click', () => this.submitCode());
        document.getElementById('clearCode').addEventListener('click', () => this.clearCode());
        document.getElementById('codeInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.submitCode();
        });
        
        document.getElementById('toggleAdmin').addEventListener('click', () => this.toggleAdmin());
        document.getElementById('uploadImages').addEventListener('click', () => this.uploadImages());
        document.getElementById('downloadAll').addEventListener('click', () => this.downloadAllImages());
        
        document.getElementById('imageUpload').addEventListener('change', (e) => this.previewImages(e));
    }

    async loadImageData() {
        try {
            const response = await fetch('./data/images.json');
            if (response.ok) {
                this.imageData = await response.json();
            } else {
                this.imageData = {};
                this.showMessage('No image data found. Use admin panel to upload images.', 'info');
            }
        } catch (error) {
            this.imageData = this.loadFromLocalStorage() || {};
            if (Object.keys(this.imageData).length === 0) {
                this.showMessage('No image data found. Use admin panel to upload images.', 'info');
            }
        }
    }

    loadFromLocalStorage() {
        const stored = localStorage.getItem('imageGalleryData');
        if (stored) {
            try {
                this.imageData = JSON.parse(stored);
                return this.imageData;
            } catch (e) {
                console.error('Error loading from localStorage:', e);
            }
        }
        return {};
    }

    saveToLocalStorage() {
        localStorage.setItem('imageGalleryData', JSON.stringify(this.imageData));
    }

    submitCode() {
        const codeInput = document.getElementById('codeInput');
        const code = codeInput.value.trim();
        
        if (!code) {
            this.showMessage('Please enter a code', 'error');
            return;
        }

        this.currentCode = code;
        this.displayImages(code);
    }

    clearCode() {
        document.getElementById('codeInput').value = '';
        this.currentCode = '';
        this.clearGallery();
        this.hideDownloadSection();
        this.showMessage('', '');
    }

    displayImages(code) {
        const gallery = document.getElementById('imageGallery');
        const images = this.imageData[code];

        if (!images || images.length === 0) {
            this.showMessage(`No images found for code: "${code}"`, 'error');
            this.clearGallery();
            this.hideDownloadSection();
            return;
        }

        gallery.innerHTML = '';
        let loadedCount = 0;
        const totalImages = images.length;

        images.forEach((imageInfo, index) => {
            const imageItem = document.createElement('div');
            imageItem.className = 'image-item';
            
            const img = document.createElement('img');
            img.src = imageInfo.url || imageInfo.path || imageInfo;
            img.alt = imageInfo.name || `Image ${index + 1}`;
            img.loading = 'lazy';
            
            img.onload = () => {
                loadedCount++;
                if (loadedCount === totalImages) {
                    this.showMessage(`Loaded ${totalImages} image(s) for code: "${code}"`, 'success');
                    this.showDownloadSection();
                }
            };
            
            img.onerror = () => {
                imageItem.innerHTML = `<div class="error-placeholder">Failed to load image</div>`;
                loadedCount++;
                if (loadedCount === totalImages) {
                    this.showMessage(`Loaded ${totalImages} image(s) for code: "${code}" (some failed)`, 'info');
                    this.showDownloadSection();
                }
            };

            const imageInfo_div = document.createElement('div');
            imageInfo_div.className = 'image-info';
            imageInfo_div.innerHTML = `
                <div><strong>${imageInfo.name || `Image ${index + 1}`}</strong></div>
                <div>Code: ${code}</div>
                ${imageInfo.uploadDate ? `<div>Uploaded: ${new Date(imageInfo.uploadDate).toLocaleDateString()}</div>` : ''}
            `;

            imageItem.appendChild(img);
            imageItem.appendChild(imageInfo_div);
            gallery.appendChild(imageItem);
        });
    }

    clearGallery() {
        const gallery = document.getElementById('imageGallery');
        gallery.innerHTML = '<div class="empty-gallery">Enter a code to view images</div>';
    }

    showDownloadSection() {
        document.getElementById('downloadSection').classList.remove('hidden');
    }

    hideDownloadSection() {
        document.getElementById('downloadSection').classList.add('hidden');
    }

    toggleAdmin() {
        const panel = document.getElementById('adminPanel');
        panel.classList.toggle('hidden');
        
        if (!panel.classList.contains('hidden')) {
            this.refreshImageList();
        }
    }

    refreshImageList() {
        const imageList = document.getElementById('imageList');
        imageList.innerHTML = '';

        if (Object.keys(this.imageData).length === 0) {
            imageList.innerHTML = '<p>No images uploaded yet.</p>';
            return;
        }

        Object.keys(this.imageData).forEach(code => {
            const codeSection = document.createElement('div');
            codeSection.style.marginBottom = '15px';
            codeSection.style.padding = '10px';
            codeSection.style.border = '1px solid #ddd';
            codeSection.style.borderRadius = '5px';

            const codeHeader = document.createElement('h4');
            codeHeader.textContent = `Code: ${code} (${this.imageData[code].length} images)`;
            codeSection.appendChild(codeHeader);

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete Code';
            deleteButton.style.marginLeft = '10px';
            deleteButton.style.background = '#dc3545';
            deleteButton.onclick = () => this.deleteCode(code);
            codeHeader.appendChild(deleteButton);

            this.imageData[code].forEach((img, index) => {
                const imgItem = document.createElement('div');
                imgItem.style.marginLeft = '20px';
                imgItem.innerHTML = `
                    <span>${img.name || `Image ${index + 1}`}</span>
                    <button onclick="imageGallery.deleteImage('${code}', ${index})" style="margin-left: 10px; background: #dc3545;">Delete</button>
                `;
                codeSection.appendChild(imgItem);
            });

            imageList.appendChild(codeSection);
        });
    }

    deleteCode(code) {
        if (confirm(`Are you sure you want to delete all images for code "${code}"?`)) {
            delete this.imageData[code];
            this.saveToLocalStorage();
            this.refreshImageList();
            this.showMessage(`Deleted all images for code: "${code}"`, 'info');
            
            if (this.currentCode === code) {
                this.clearCode();
            }
        }
    }

    deleteImage(code, index) {
        if (confirm('Are you sure you want to delete this image?')) {
            this.imageData[code].splice(index, 1);
            if (this.imageData[code].length === 0) {
                delete this.imageData[code];
            }
            this.saveToLocalStorage();
            this.refreshImageList();
            this.showMessage('Image deleted', 'info');
            
            if (this.currentCode === code) {
                this.displayImages(code);
            }
        }
    }

    previewImages(event) {
        const files = event.target.files;
        const code = document.getElementById('newImageCode').value.trim();
        
        if (!code) {
            this.showMessage('Please enter a code for the images', 'error');
            return;
        }

        if (files.length === 0) return;

        this.showMessage(`Selected ${files.length} file(s) for code: "${code}"`, 'info');
    }

    uploadImages() {
        const code = document.getElementById('newImageCode').value.trim();
        const fileInput = document.getElementById('imageUpload');
        const files = fileInput.files;

        if (!code) {
            this.showMessage('Please enter a code for the images', 'error');
            return;
        }

        if (files.length === 0) {
            this.showMessage('Please select at least one image', 'error');
            return;
        }

        if (!this.imageData[code]) {
            this.imageData[code] = [];
        }

        let processedCount = 0;
        const totalFiles = files.length;

        Array.from(files).forEach((file, index) => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const imageInfo = {
                        name: file.name,
                        url: e.target.result,
                        uploadDate: new Date().toISOString(),
                        size: file.size,
                        type: file.type
                    };
                    
                    this.imageData[code].push(imageInfo);
                    processedCount++;
                    
                    if (processedCount === totalFiles) {
                        this.saveToLocalStorage();
                        this.showMessage(`Successfully uploaded ${totalFiles} image(s) for code: "${code}"`, 'success');
                        this.refreshImageList();
                        
                        document.getElementById('newImageCode').value = '';
                        fileInput.value = '';
                    }
                };
                reader.readAsDataURL(file);
            } else {
                processedCount++;
                this.showMessage(`Skipped non-image file: ${file.name}`, 'error');
            }
        });
    }

    downloadAllImages() {
        if (!this.currentCode || !this.imageData[this.currentCode]) {
            this.showMessage('No images to download', 'error');
            return;
        }

        const images = this.imageData[this.currentCode];
        images.forEach((imageInfo, index) => {
            const link = document.createElement('a');
            link.href = imageInfo.url || imageInfo.path || imageInfo;
            link.download = imageInfo.name || `image_${this.currentCode}_${index + 1}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });

        this.showMessage(`Downloaded ${images.length} image(s)`, 'success');
    }

    showMessage(message, type) {
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

let imageGallery;

document.addEventListener('DOMContentLoaded', () => {
    imageGallery = new ImageGallery();
});