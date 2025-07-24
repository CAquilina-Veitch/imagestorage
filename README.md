# Code-Protected Image Gallery

A simple web application that allows users to view images by entering access codes. Built for GitHub Pages deployment.

## Features

- **Code-based access**: Users enter codes to view specific image collections
- **Image upload**: Admin panel for uploading new images with assigned codes
- **Download functionality**: Download all images for a given code
- **Responsive design**: Works on desktop and mobile devices
- **Local storage**: Images are stored as base64 data in browser localStorage
- **GitHub Pages ready**: Static files that work with GitHub Pages hosting

## How to Use

### For Users
1. Open the website
2. Enter your access code (e.g., "Test code 1")
3. Click "View Images" to see images associated with that code
4. Use "Download All Images" to save images locally

### For Admins
1. Click "Admin Panel" to expand upload interface
2. Enter a code for new images
3. Select image files to upload
4. Click "Upload" to add images to that code
5. Manage existing images through the admin interface

## Deployment to GitHub Pages

1. Push all files to your GitHub repository
2. Go to Settings > Pages in your GitHub repository
3. Select source branch (usually `main` or `gh-pages`)
4. Your site will be available at `https://yourusername.github.io/repository-name`

## File Structure

```
├── index.html          # Main HTML file
├── styles.css          # CSS styling
├── script.js           # JavaScript functionality
├── data/
│   └── images.json     # Image metadata (optional, fallback to localStorage)
├── images/             # Directory for storing image files (if using file storage)
└── README.md          # This file
```

## Storage Options

The application supports two storage methods:

1. **localStorage** (default): Images stored as base64 in browser storage
2. **File-based**: Images stored in `/images` directory with metadata in `/data/images.json`

## Browser Compatibility

- Modern browsers with localStorage support
- File API support for image uploads
- ES6+ JavaScript features

## Security Note

This is a client-side only solution. The "code protection" is not secure against determined users, as all data is accessible in the browser. For true security, consider server-side authentication.