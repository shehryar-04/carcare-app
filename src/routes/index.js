const express = require('express');
const {
  createUser,
  verifyEmail,
  getUsers,
  getUserById,
  updateUser,
  resendVerificationEmail,
  addLocation,
  deleteLocation,
  sendPushNotification,
  postFcmToken,
  updateUserVerification
} = require('../controllers/userController');
const {
  createService,
  getServiceById,
  getAllServices,
  updateService,
  deleteService,
  requestService,
  getServicesRequests,
  getServiceRequestById,
  updateServiceRequestAllFields,
  updateServiceRequest,
  deleteServiceRequest,
  getServiceRequestByUserId,
  getServiceRequestByArea,
  acceptServiceRequest,
  getServiceRequestByVendor,
  cancelServiceRequest,
  cancelServiceRequestByUser,
  completeServiceRequest
} = require('../controllers/serviceController');
const {
  createBlog,
  getBlogById,
  getAllBlogs,
  updateBlog,
  deleteBlog,
} = require('../controllers/blogController');
const {
  createBanner,
  getBannerById,
  getAllBanners,
  updateBanner,
  deleteBanner,
} = require('../controllers/bannerController');
const {
  uploadImage,
  getImage,
  deleteImage,
  getAllImages,
} = require('../controllers/uploadController');
const {
  createArea,
  getAllAreas,
  getAreaById,
  updateArea,
  deleteArea,
} = require('../controllers/areaController');
const {
  createWishlist,
  getWishlistByUserId,
  deleteFromWishlist,
} = require('../controllers/wishlistController');
const {
  addToCart,
  getCartByUserId,
  deleteFromCart,
} = require('../controllers/cartController');
const {
  createCategory,
  getCategoryById,
  getAllCategories,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const {
  addSubscriber,
  getAllSubscribers,
} = require('../controllers/subscriptionController');
const {
  createProduct,
  getProductById,
  getAllProducts,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { sendMessageToVendor, getAllChatsForUser, getAllChatsForVendor } = require('../controllers/chatController');
const vendorController = require('../controllers/vendorController');
const upload = require('../middlewares/multerConfig');
// const notification = require('../controllers/toAllNotifiction')
const { sendNotificationTopic } = require('../controllers/toTopicNotifiction');
const { sendNotificationToken } = require('../controllers/toTokenNotifiction');

const router = express.Router();

// User-related routes
router.post('/createUser', createUser);
router.get('/verifyEmail', verifyEmail);
router.get('/users', getUsers);
router.get('/user/:uid', getUserById);
router.put('/user/:uid', updateUser);
router.post('resendVerificationEmail/:uid', resendVerificationEmail);
router.post('/users/:uid/locations', addLocation);
router.delete('/users/:uid/locations', deleteLocation);
router.post('/user/:uid/fcm-token', postFcmToken);
router.post('/:uid/notifications', sendPushNotification);
router.put('/users/:uid/verification', updateUserVerification);
// Service-related routes
router.post('/createService', createService);
router.get('/services', getAllServices);
router.get('/service/:id', getServiceById);
router.put('/service/:id', updateService);
router.delete('/service/:id', deleteService);
// Service-requestes routes
router.post('/service-request', requestService);
router.get('/service-request', getServicesRequests);
router.get('/service-request/:id', getServiceRequestById);
router.get('/service-requests/user/:userId', getServiceRequestByUserId);
router.get('/service-request/area/:area', getServiceRequestByArea);
router.put('/service-request/:id', updateServiceRequestAllFields);
router.put('/service-request/:requestId/accept/:vendorId', acceptServiceRequest)
router.patch('/service-request/:id', updateServiceRequest);
router.get('/service-requests/vendor/:vendorId', getServiceRequestByVendor);
router.put('/service-request/:requestId/vendor/:vendorId/cancel', cancelServiceRequest);
router.patch('/service-request/:requestId/cancelByUser/:userId', cancelServiceRequestByUser);
router.post('/serviceRequests/:userId/:vendorId/:serviceRequestId/complete', completeServiceRequest)//complete service request {{"servicePerformed": true, // or false  "userRating": 4.5         // Optional, provided if the service was performed}
router.delete('/service-request/:id', deleteServiceRequest);

// Blog-related routes
router.post('/createBlog', createBlog);
router.get('/blogs', getAllBlogs);
router.get('/blog/:id', getBlogById);
router.put('/blog/:id', updateBlog);
router.delete('/blog/:id', deleteBlog);
// Chat-related routes
router.post('/chat/:userId/:vendorId', sendMessageToVendor);
router.get('/chats/user/:userId', getAllChatsForUser);
router.get('/chats/vendor/:vendorId', getAllChatsForVendor);

// Area-related routes
router.post('/areas', createArea);
router.get('/areas', getAllAreas);
router.get('/areas/:id', getAreaById);
router.put('/areas/:id', updateArea);
router.delete('/areas/:id', deleteArea);
// Banner-related routes
router.post('/createBanner', createBanner);
router.get('/banners', getAllBanners);
router.get('/banner/:id', getBannerById);
router.put('/banner/:id', updateBanner);
router.delete('/banner/:id', deleteBanner);
// Image-related routes
router.post('/uploadImage', upload.single('image'), uploadImage);
router.get('/images', getAllImages);
router.get('/image/:filename', getImage);
router.delete('/image/:filename', deleteImage);
// Vendor-related routes
router.post('/createVendor', vendorController.registerVendor);
router.put('/vendor/:vendorId', vendorController.updateVendor);
router.get('/vendors', vendorController.getVendors);
router.get('/vendor/:vendorId', vendorController.getVendorById);
router.delete('/vendor/:vendorId', vendorController.deleteVendor);

router.post('/wishlist', createWishlist);
router.get('/wishlist/:userId', getWishlistByUserId);
router.delete('/wishlist/:userId', deleteFromWishlist);
// Cart-related routes
router.post('/addToCart', addToCart);
router.get('/cart/:userId', getCartByUserId);
router.delete('/cart/:userId', deleteFromCart);
// Categories-related routes
router.post('/createCategory', createCategory);
router.get('/categories', getAllCategories);
router.get('/category/:id', getCategoryById);
router.put('/category/:id', updateCategory);
router.delete('/category/:id', deleteCategory);
// Subscription-related routes
router.post('/subscribe', addSubscriber);
router.get('/subscribers', getAllSubscribers);
// Product-related routes
router.post('/createProduct', createProduct);
router.get('/products', getAllProducts);
router.get('/product/:id', getProductById);
router.put('/product/:id', updateProduct);
router.delete('/product/:id', deleteProduct);

router.post('/send-notification-topic', sendNotificationTopic)
router.post('/send-notification-token', sendNotificationToken)

module.exports = router;
