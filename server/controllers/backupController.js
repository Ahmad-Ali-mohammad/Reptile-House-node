import * as backupService from '../utils/backupService.js';

export async function getSettings(req, res) {
  try {
    const settings = await backupService.getBackupSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function setSettings(req, res) {
  try {
    const settings = await backupService.saveBackupSettings(req.body || {});
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function list(req, res) {
  try {
    const rows = await backupService.listBackups();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function create(req, res) {
  try {
    const row = await backupService.createBackup({
      type: req.body?.type || 'full',
      triggeredBy: req.authUser?.id || req.apiKey?.id || null,
      isAutomatic: false,
      description: typeof req.body?.description === 'string' ? req.body.description.trim() : '',
    });
    res.status(201).json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function restore(req, res) {
  try {
    const row = await backupService.restoreBackup(req.params.id);
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function download(req, res) {
  try {
    const backup = await backupService.getDownloadInfo(req.params.id);
    res.download(backup.filePath, backup.fileName || `${backup.id}.json.gz`);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
}

export async function remove(req, res) {
  try {
    const ok = await backupService.deleteBackup(req.params.id);
    if (!ok) return res.status(404).json({ error: 'النسخة الاحتياطية غير موجودة' });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
