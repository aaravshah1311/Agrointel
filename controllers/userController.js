const axios = require('axios');
const pool = require('../config/db');
const mlService = require('../ml_models/ml_service');

const getWeatherData = async (city) => {
    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${process.env.OPENWEATHER_API_KEY}`;
        const response = await axios.get(url);
        return {
            temperature: response.data.main.temp,
            humidity: response.data.main.humidity,
            rainfall: response.data.rain ? response.data.rain['1h'] : 0 // Rainfall in last 1h
        };
    } catch (error) {
        console.error("Error fetching weather data:", error.message);
        return { temperature: 'N/A', humidity: 'N/A', rainfall: 'N/A' };
    }
};

exports.getDashboard = async (req, res) => {
    const userId = req.session.user.id;
    const userCity = req.session.user.city;

    try {
        const [userCrop] = await pool.query('SELECT * FROM user_crops WHERE user_id = ? ORDER BY sowing_date DESC LIMIT 1', [userId]);

        if (userCrop.length === 0) {
            req.flash('error_msg', 'Please select a crop to view your dashboard.');
            return res.redirect('/user/select-crop');
        }

        const weatherData = await getWeatherData(userCity);
        const crop = userCrop[0];

        const timeline = mlService.getCropTimeline(crop.crop_name);

        res.render('dashboard', {
            title: 'Dashboard',
            weather: weatherData,
            crop: crop,
            timeline: timeline
        });
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'An error occurred. Please log in again.');
        res.redirect('/auth/login');
    }
};

exports.getSelectCrop = async (req, res) => {
    const soilData = mlService.getSimulatedSoilData(req.session.user.city);
    const weatherData = await getWeatherData(req.session.user.city);

    const recommendedCrops = mlService.recommendCrop(
        soilData.N,
        soilData.P,
        soilData.K,
        weatherData.temperature,
        weatherData.humidity,
        soilData.ph,
        weatherData.rainfall
    );

    res.render('selectCrop', {
        title: 'Select Crop',
        crops: recommendedCrops.slice(0, 12) // Show top 12 recommendations
    });
};

exports.postSelectCrop = async (req, res) => {
    const { cropName } = req.body;
    const userId = req.session.user.id;
    const sowingDate = new Date();
    let connection; // Define connection here to be accessible in catch block

    try {
        // Step 1: Get a connection from the pool to run a transaction
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Step 2: Delete any existing crop records for this user
        await connection.query('DELETE FROM user_crops WHERE user_id = ?', [userId]);

        // Step 3: Insert the new crop record
        const cropDuration = mlService.getCropDuration(cropName); // in days
        const harvestDate = new Date(sowingDate);
        harvestDate.setDate(harvestDate.getDate() + cropDuration);

        await connection.query(
            'INSERT INTO user_crops (user_id, crop_name, sowing_date, harvest_date) VALUES (?, ?, ?, ?)',
            [userId, cropName, sowingDate, harvestDate]
        );
        
        // Step 4: If everything is successful, commit the changes
        await connection.commit();
        
        req.flash('success_msg', `${cropName} has been selected successfully!`);
        res.redirect('/user/dashboard');

    } catch (error) {
        // If any step fails, roll back the transaction
        if (connection) await connection.rollback();
        console.error(error);
        req.flash('error_msg', 'Failed to change crop. Please try again.');
        res.redirect('/user/select-crop');
    } finally {
        // Step 5: Always release the connection back to the pool
        if (connection) connection.release();
    }
};

exports.getCropDetails = (req, res) => {
    const cropName = req.params.cropName;
    const details = mlService.getCropInfo(cropName, req.session.user.land_area_sqft);
    if (!details) {
        req.flash('error_msg', 'Crop details not found.');
        return res.redirect('/user/select-crop');
    }
    res.render('cropDetails', {
        title: `${cropName} Details`,
        crop: details
    });
};

exports.getCheckLand = async (req, res) => {
    const soilData = mlService.getSimulatedSoilData(req.session.user.city);
    const weatherData = await getWeatherData(req.session.user.city);

    res.render('checkLand', {
        title: 'Check My Land',
        soil: soilData,
        weather: weatherData
    });
};