import { db } from '../database/dbConnection.js';
import { v4 as uuidv4 } from 'uuid';

// Renders all folders for the logged-in user
export const renderFolders = async (req, res) => {
  const userId = req.session.userId;
  const [folders] = await db.execute('SELECT * FROM folders WHERE user_id = ?', [userId]);

  res.render('folders', { folders });
};

// Renders all files inside a specific folder
export const renderFilesInFolder = async (req, res) => {
  const folderId = req.params.id;
  const userId = req.session.userId;

  const [folder] = await db.execute('SELECT * FROM folders WHERE id = ? AND user_id = ?', [folderId, userId]);
  const [files] = await db.execute('SELECT * FROM files WHERE folder_id = ?', [folderId]);

  if (folder.length === 0) return res.status(404).send('Folder not found');

  res.render('files', { folder: folder[0], files });
};

// Creates a new folder
export const createFolder = async (req, res) => {
  const folderId = uuidv4();
  await db.execute(
    'INSERT INTO folders (id, name, user_id) VALUES (?, ?, ?)',
    [folderId, req.body.folderName, req.session.userId]
  );

  res.redirect('/get-documents');
};

// Uploads a file into a folder
export const uploadFileToFolder = async (req, res) => {
  const { folderId } = req.body;
  const file = req.file;

  if (!file) return res.redirect(`/folder/${folderId}`);

  const fileId = uuidv4();
  await db.execute(
    'INSERT INTO files (id, filename, mimetype, size, content, folder_id, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [fileId, file.originalname, file.mimetype, file.size, file.buffer, folderId, req.session.userId]
  );

  res.redirect(`/folder/${folderId}`);
};

// Streams file content for preview
export const streamFile = async (req, res) => {
  const [rows] = await db.execute('SELECT * FROM files WHERE id = ?', [req.params.id]);
  if (rows.length === 0) return res.status(404).send('File not found');

  const file = rows[0];
  res.setHeader('Content-Type', file.mimetype);
  res.send(file.content);
};

// Triggers file download
export const downloadFile = async (req, res) => {
  const [rows] = await db.execute('SELECT * FROM files WHERE id = ?', [req.params.id]);
  if (rows.length === 0) return res.status(404).send('File not found');

  const file = rows[0];
  res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
  res.setHeader('Content-Type', file.mimetype);
  res.send(file.content);
};

// Deletes a folder
export const deleteFolder = async (req, res) => {
  await db.execute('DELETE FROM folders WHERE id = ? AND user_id = ?', [req.params.id, req.session.userId]);
  res.redirect('/get-documents');
};

// Deletes a file
export const deleteFile = async (req, res) => {
  const folderId = req.body.folderId;
  await db.execute('DELETE FROM files WHERE id = ? AND user_id = ?', [req.params.id, req.session.userId]);
  res.redirect(`/folder/${folderId}`);
};