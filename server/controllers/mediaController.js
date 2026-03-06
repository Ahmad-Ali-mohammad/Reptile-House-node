import * as MediaModel from '../models/MediaModel.js';
import { storeUploadedBuffer, storeUploadedFile } from '../utils/mediaStorage.js';

export async function list(req, res) {
  try {
    const { search, folderId, category } = req.query;

    let rows;
    if (search) {
      rows = await MediaModel.search(search);
    } else {
      rows = await MediaModel.findAll(folderId, category);
    }

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function get(req, res) {
  try {
    const row = await MediaModel.findById(req.params.id);
    if (!row) return res.status(404).json({ error: 'الوسائط غير موجودة' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function create(req, res) {
  try {
    const row = await MediaModel.create(req.body);
    res.status(201).json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function uploadFile(req, res) {
  try {
    const { dataUrl, fileName, mimeType, category } = req.body || {};

    if (req.file) {
      const file = await storeUploadedBuffer({
        buffer: req.file.buffer,
        fileName: req.file.originalname || fileName,
        mimeType: req.file.mimetype || mimeType,
        category,
      });
      return res.status(201).json(file);
    }

    if (!dataUrl || !fileName) {
      return res.status(400).json({ error: 'File payload is required' });
    }

    const file = await storeUploadedFile({ dataUrl, fileName, mimeType, category });
    res.status(201).json(file);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function update(req, res) {
  try {
    const row = await MediaModel.update(req.params.id, req.body);
    if (!row) return res.status(404).json({ error: 'الوسائط غير موجودة' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function remove(req, res) {
  try {
    const ok = await MediaModel.remove(req.params.id);
    if (!ok) return res.status(404).json({ error: 'الوسائط غير موجودة' });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function bulkDelete(req, res) {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'يجب توفير قائمة IDs' });
    }
    const count = await MediaModel.bulkDelete(ids);
    res.json({ deleted: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
