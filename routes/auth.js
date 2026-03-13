const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');

// Signup Routes
router.get('/signup', authController.getSignup);
router.post('/signup', [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('confirmPassword').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Passwords do not match');
        }
        return true;
    }),
    body('state').notEmpty().withMessage('State is required'),
    body('city').notEmpty().withMessage('City is required'),
    body('land_area_sqft').isNumeric().withMessage('Land area must be a number')
], authController.postSignup);


// Login Routes
router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);

// Logout
router.get('/logout', authController.logout);


module.exports = router;