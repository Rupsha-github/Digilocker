import express from 'express';
import multer from 'multer';
import { searchFolders, searchFiles, renderFolders, renderFilesInFolder, createFolder, uploadFileToFolder, streamFile, downloadFile, deleteFolder, deleteFile } from '../controllers/documents.js';
import { ensureLoggedIn } from '../middlewares/authGuards.js';

const router = express.Router();

// Multer setup
const upload = multer({
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg'];
    cb(null, allowed.includes(file.mimetype));
  }
});

// Home route
router.get('/', (req, res) => res.render('home'));

// Folder and file routes
router.get('/get-documents', ensureLoggedIn, renderFolders);
router.get('/folder/:id', ensureLoggedIn, renderFilesInFolder);
router.post('/create-folder', ensureLoggedIn, createFolder);

// Upload route with error handling
router.post('/upload-file', ensureLoggedIn, (req, res, next) => {
  upload.single('file')(req, res, err => {
    if (err) {
      return res.redirect(`/folder/${req.body.folderId}`);
    }
    next();
  });
}, uploadFileToFolder);

// File preview and download
router.get('/view-file/:id', ensureLoggedIn, streamFile);
router.get('/download-file/:id', ensureLoggedIn, downloadFile);

// Delete routes
router.post('/delete-folder/:id', ensureLoggedIn, deleteFolder);
router.post('/delete-file/:id', ensureLoggedIn, deleteFile);

// Search routes
router.get('/search-folders', ensureLoggedIn, searchFolders);
router.get('/search-files/:folderId', ensureLoggedIn, searchFiles);

export default router;