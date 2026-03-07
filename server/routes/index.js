import { Router } from 'express';
import multer from 'multer';
import * as productController from '../controllers/productController.js';
import * as orderController from '../controllers/orderController.js';
import * as userController from '../controllers/userController.js';
import * as authController from '../controllers/authController.js';
import * as articleController from '../controllers/articleController.js';
import * as supplyController from '../controllers/supplyController.js';
import * as heroController from '../controllers/heroController.js';
import * as addressController from '../controllers/addressController.js';
import * as settingsController from '../controllers/settingsController.js';
import * as teamController from '../controllers/teamController.js';
import * as filterController from '../controllers/filterController.js';
import * as customDataController from '../controllers/customDataController.js';
import * as policyController from '../controllers/policyController.js';
import * as offerController from '../controllers/offerController.js';
import * as pageContentController from '../controllers/pageContentController.js';
import * as mediaController from '../controllers/mediaController.js';
import * as mediaFolderController from '../controllers/mediaFolderController.js';
import * as userPreferencesController from '../controllers/userPreferencesController.js';
import * as serviceController from '../controllers/serviceController.js';
import * as systemController from '../controllers/systemController.js';
import * as apiKeyController from '../controllers/apiKeyController.js';
import * as backupController from '../controllers/backupController.js';
import { attachApiKey, requireAuth, requireRoles } from '../middleware/auth.js';
import { MAX_UPLOAD_BYTES } from '../utils/mediaStorage.js';

const router = Router();
const manageRoles = ['admin', 'manager'];
const editorRoles = ['admin', 'manager', 'editor'];
const mediaUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES },
});

// Auth
router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);
router.post('/auth/bootstrap-admin', authController.bootstrapAdmin);

router.use(attachApiKey);

// Users
router.get('/users', requireRoles(...manageRoles), userController.list);
router.get('/users/:id', requireAuth, userController.get);
router.put('/users/:id', requireAuth, userController.update);
router.delete('/users/:id', requireRoles(...manageRoles), userController.remove);

// Products
router.get('/products', productController.list);
router.get('/products/:id', productController.get);
router.post('/products', requireRoles(...editorRoles), productController.create);
router.put('/products/:id', requireRoles(...editorRoles), productController.update);
router.delete('/products/:id', requireRoles(...editorRoles), productController.remove);

// Orders
router.get('/orders', requireRoles(...manageRoles), orderController.list);
router.get('/orders/my', requireAuth, orderController.listMine);
router.get('/orders/:id', requireRoles(...manageRoles), orderController.get);
router.post('/orders', requireAuth, orderController.create);
router.put('/orders/:id', requireRoles(...manageRoles), orderController.update);
router.patch('/orders/:id/status', requireRoles(...manageRoles), orderController.updateStatus);
router.delete('/orders/:id', requireRoles(...manageRoles), orderController.remove);

// Articles
router.get('/articles', articleController.list);
router.get('/articles/:id', articleController.get);
router.post('/articles', requireRoles(...editorRoles), articleController.create);
router.put('/articles/:id', requireRoles(...editorRoles), articleController.update);
router.delete('/articles/:id', requireRoles(...editorRoles), articleController.remove);

// Supplies
router.get('/supplies', supplyController.list);
router.get('/supplies/:id', supplyController.get);
router.post('/supplies', requireRoles(...editorRoles), supplyController.create);
router.put('/supplies/:id', requireRoles(...editorRoles), supplyController.update);
router.delete('/supplies/:id', requireRoles(...editorRoles), supplyController.remove);

// Hero slides
router.get('/hero', heroController.list);
router.get('/hero/:id', heroController.get);
router.post('/hero', requireRoles(...editorRoles), heroController.create);
router.put('/hero/:id', requireRoles(...editorRoles), heroController.update);
router.delete('/hero/:id', requireRoles(...editorRoles), heroController.remove);

// Addresses
router.get('/addresses', requireAuth, addressController.list);
router.get('/addresses/:id', requireAuth, addressController.get);
router.post('/addresses', requireAuth, addressController.create);
router.put('/addresses/:id', requireAuth, addressController.update);
router.delete('/addresses/:id', requireAuth, addressController.remove);

// Settings (single-row)
router.get('/settings/company', settingsController.getCompany);
router.put('/settings/company', requireRoles(...manageRoles), settingsController.setCompany);
router.get('/settings/contact', settingsController.getContact);
router.put('/settings/contact', requireRoles(...manageRoles), settingsController.setContact);
router.get('/settings/shamcash', settingsController.getShamcash);
router.put('/settings/shamcash', requireRoles(...manageRoles), settingsController.setShamcash);
router.get('/settings/seo', settingsController.getSeo);
router.put('/settings/seo', requireRoles(...manageRoles), settingsController.setSeo);
router.get('/settings/store', settingsController.getStore);
router.put('/settings/store', requireRoles(...manageRoles), settingsController.setStore);

// Team
router.get('/team', teamController.list);
router.get('/team/:id', teamController.get);
router.post('/team', requireRoles(...manageRoles), teamController.create);
router.put('/team/:id', requireRoles(...manageRoles), teamController.update);
router.delete('/team/:id', requireRoles(...manageRoles), teamController.remove);

// Filters
router.get('/filters', filterController.list);
router.get('/filters/:id', filterController.get);
router.post('/filters', requireRoles(...manageRoles), filterController.create);
router.put('/filters/:id', requireRoles(...manageRoles), filterController.update);
router.delete('/filters/:id', requireRoles(...manageRoles), filterController.remove);

// Custom categories & species
router.get('/custom-categories', customDataController.getCategories);
router.post('/custom-categories', requireRoles(...manageRoles), customDataController.addCategory);
router.get('/custom-species', customDataController.getSpecies);
router.post('/custom-species', requireRoles(...manageRoles), customDataController.addSpecies);

// Policies
router.get('/policies', policyController.list);
router.get('/policies/:id', policyController.get);
router.post('/policies', requireRoles(...editorRoles), policyController.create);
router.put('/policies/:id', requireRoles(...editorRoles), policyController.update);
router.delete('/policies/:id', requireRoles(...editorRoles), policyController.remove);

// Offers
router.get('/offers', offerController.list);
router.get('/offers/:id', offerController.get);
router.post('/offers', requireRoles(...editorRoles), offerController.create);
router.put('/offers/:id', requireRoles(...editorRoles), offerController.update);
router.delete('/offers/:id', requireRoles(...editorRoles), offerController.remove);

// Services
router.get('/services', serviceController.list);
router.get('/services/:id', serviceController.get);
router.post('/services', requireRoles(...editorRoles), serviceController.create);
router.put('/services/:id', requireRoles(...editorRoles), serviceController.update);
router.delete('/services/:id', requireRoles(...editorRoles), serviceController.remove);
router.post('/services/reorder', requireRoles(...editorRoles), serviceController.reorder);

// Page contents CMS
router.get('/page-contents', pageContentController.list);
router.get('/page-contents/slug/:slug', pageContentController.getBySlug);
router.get('/page-contents/:id', pageContentController.get);
router.post('/page-contents', requireRoles(...editorRoles), pageContentController.create);
router.put('/page-contents/:id', requireRoles(...editorRoles), pageContentController.update);
router.delete('/page-contents/:id', requireRoles(...editorRoles), pageContentController.remove);

// Media library
router.get('/media', mediaController.list);
router.get('/media/:id', mediaController.get);
router.post('/media/upload-file', requireAuth, mediaUpload.single('file'), mediaController.uploadFile);
router.post('/media', requireRoles(...editorRoles), mediaController.create);
router.put('/media/:id', requireRoles(...editorRoles), mediaController.update);
router.delete('/media/:id', requireRoles(...editorRoles), mediaController.remove);
router.post('/media/bulk-delete', requireRoles(...editorRoles), mediaController.bulkDelete);

// Media folders
router.get('/media-folders', mediaFolderController.list);
router.get('/media-folders/:id', mediaFolderController.get);
router.post('/media-folders', requireRoles(...editorRoles), mediaFolderController.create);
router.put('/media-folders/:id', requireRoles(...editorRoles), mediaFolderController.update);
router.delete('/media-folders/:id', requireRoles(...editorRoles), mediaFolderController.remove);

// User preferences
router.get('/user-preferences', requireAuth, userPreferencesController.get);
router.put('/user-preferences', requireAuth, userPreferencesController.update);

// API keys
router.get('/api-keys', requireRoles(...manageRoles), apiKeyController.list);
router.post('/api-keys', requireRoles(...manageRoles), apiKeyController.create);
router.put('/api-keys/:id', requireRoles(...manageRoles), apiKeyController.update);
router.delete('/api-keys/:id', requireRoles(...manageRoles), apiKeyController.remove);
router.post('/api-keys/:id/regenerate', requireRoles(...manageRoles), apiKeyController.regenerate);

// Backups
router.get('/backup-settings', requireRoles(...manageRoles), backupController.getSettings);
router.put('/backup-settings', requireRoles(...manageRoles), backupController.setSettings);
router.get('/backups', requireRoles(...manageRoles), backupController.list);
router.post('/backups', requireRoles(...manageRoles), backupController.create);
router.post('/backups/:id/restore', requireRoles(...manageRoles), backupController.restore);
router.get('/backups/:id/download', requireRoles(...manageRoles), backupController.download);
router.delete('/backups/:id', requireRoles(...manageRoles), backupController.remove);

// System
router.get('/system/db-status', requireRoles(...manageRoles), systemController.getDatabaseStatus);

export default router;
