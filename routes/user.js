const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Middleware to protect routes
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    req.flash('error_msg', 'Please log in to view this resource');
    res.redirect('/auth/login');
};

router.get('/dashboard', isAuthenticated, userController.getDashboard);
router.get('/select-crop', isAuthenticated, userController.getSelectCrop);
router.post('/select-crop', isAuthenticated, userController.postSelectCrop);
router.get('/crop-details/:cropName', isAuthenticated, userController.getCropDetails);
router.get('/check-land', isAuthenticated, userController.getCheckLand);

// Placeholder route for image analysis
router.post('/check-crop', isAuthenticated, (req, res) => {
    // In a real app, you would use a service like Google Vision AI or a custom model
    // Here we simulate the result
    const simulatedResult = {
        ripe: "75%",
        risk: "Low risk of powdery mildew detected.",
        precautions: "Ensure proper air circulation and monitor humidity levels.",
        timeToRipe: "Approximately 15-20 days until fully ripe."
    };
    res.json(simulatedResult);
});


module.exports = router;