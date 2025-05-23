const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const isAuthenticated = require('../middleware/isAuthenticated');

router.use(isAuthenticated); 
router.get('/', userController.getAllUsers);
router.get('/new', userController.getNewUserForm);
router.post('/', userController.createNewUser);
router.get('/:id/edit', userController.getEditUserForm);
router.put('/:id', userController.updateUser); // Menggunakan PUT via method-override
router.delete('/:id', userController.deleteUser); // Menggunakan DELETE via method-override

module.exports = router;