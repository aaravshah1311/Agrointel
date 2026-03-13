const fs = require('fs');
const path = require('path');

// --- 1. DATA LOADING ---
// Load the crop recommendation dataset from the CSV file upon server start.
const cropDataPath = path.join(__dirname, 'Crop_recommendation.csv');
const cropData = fs.readFileSync(cropDataPath, 'utf-8')
    .split('\n')
    .slice(1) // Skip the header row
    .map(row => {
        const [N, P, K, temperature, humidity, ph, rainfall, label] = row.split(',');
        // Parse each value and clean up the crop label.
        return {
            N: parseFloat(N), P: parseFloat(P), K: parseFloat(K), temperature: parseFloat(temperature),
            humidity: parseFloat(humidity), ph: parseFloat(ph), rainfall: parseFloat(rainfall),
            label: label ? label.trim() : ''
        };
    }).filter(d => d.label); // Filter out any empty rows at the end of the file

// --- 2. RECOMMENDATION LOGIC ---

/**
 * Calculates the Euclidean distance to find how "similar" user conditions are to the dataset.
 * @param {object} p1 - First point (e.g., user's land data)
 * @param {object} p2 - Second point (e.g., a row from the CSV)
 * @returns {number} The calculated distance.
 */
const euclideanDistance = (p1, p2) => {
    return Math.sqrt(
        Math.pow(p1.N - p2.N, 2) + Math.pow(p1.P - p2.P, 2) + Math.pow(p1.K - p2.K, 2) +
        Math.pow(p1.temperature - p2.temperature, 2) + Math.pow(p1.humidity - p2.humidity, 2) +
        Math.pow(p1.ph - p2.ph, 2) + Math.pow(p1.rainfall - p2.rainfall, 2)
    );
};

/**
 * Recommends a diverse list of crops based on input soil and weather conditions.
 */
exports.recommendCrop = (N, P, K, temperature, humidity, ph, rainfall) => {
    const inputPoint = { N, P, K, temperature, humidity, ph, rainfall };
    
    // Calculate the distance from user's conditions to every data point.
    let distances = cropData.map(dataPoint => ({
        dist: euclideanDistance(inputPoint, dataPoint),
        label: dataPoint.label
    }));
    
    // Sort all data points by best match first.
    distances.sort((a, b) => a.dist - b.dist);
    
    // Create a list of the top UNIQUE recommendations to ensure variety.
    const uniqueRecommendedCrops = [];
    const seenCrops = new Set();

    for (const item of distances) {
        if (!seenCrops.has(item.label)) {
            uniqueRecommendedCrops.push(item.label);
            seenCrops.add(item.label);
        }
        // Stop when we have enough recommendations.
        if (uniqueRecommendedCrops.length >= 12) break;
    }
    
    return uniqueRecommendedCrops;
};

// --- 3. SIMULATED & STATIC DATA ---

// Simulated soil data for various Indian cities.
const citySoilData = {
    'Mumbai': { N: 85, P: 45, K: 22, ph: 6.8 },
    'Delhi': { N: 95, P: 50, K: 25, ph: 7.1 },
    'Bangalore': { N: 75, P: 35, K: 18, ph: 6.5 },
    'Vadodara': { N: 88, P: 48, K: 30, ph: 7.5 },
    'Pune': { N: 82, P: 40, K: 20, ph: 6.7 },
    'Chennai': { N: 78, P: 38, K: 15, ph: 6.9 },
    'Default': { N: 90, P: 42, K: 43, ph: 6.5 }
};

exports.getSimulatedSoilData = (city) => citySoilData[city] || citySoilData['Default'];

// Central database for all crop-specific details.
const cropDetails = {
    rice: { duration: 120, price: 20, water: 1200, budget: 15000, yield: 2200, reqTemp: '21-37 °C', reqHumidity: '80-82 %', risk: 'High risk of blast disease', advantage: 'High demand staple food.' },
    maize: { duration: 90, price: 15, water: 600, budget: 10000, yield: 3000, reqTemp: '21-27 °C', reqHumidity: '65-75 %', risk: 'Susceptible to stalk borers', advantage: 'Versatile use (food, feed).' },
    chickpea: { duration: 100, price: 50, water: 400, budget: 8000, yield: 800, reqTemp: '18-26 °C', reqHumidity: '50-60 %', risk: 'Prone to pod borer attack', advantage: 'Nitrogen-fixing crop.' },
    kidneybeans: { duration: 80, price: 80, water: 500, budget: 12000, yield: 1000, reqTemp: '20-27 °C', reqHumidity: '60-65 %', risk: 'Sensitive to high temperatures', advantage: 'High protein content.' },
    pigeonpeas: { duration: 150, price: 70, water: 450, budget: 9000, yield: 700, reqTemp: '27-35 °C', reqHumidity: '50-60 %', risk: 'Wilt disease is a major concern', advantage: 'Drought tolerant.' },
    mothbeans: { duration: 75, price: 60, water: 300, budget: 7000, yield: 500, reqTemp: '27-32 °C', reqHumidity: '45-55 %', risk: 'Low yield potential', advantage: 'Excellent for arid regions.' },
    mungbean: { duration: 65, price: 90, water: 350, budget: 11000, yield: 600, reqTemp: '28-35 °C', reqHumidity: '85-90 %', risk: 'Yellow mosaic virus', advantage: 'Short duration, fits in crop cycles.' },
    blackgram: { duration: 85, price: 85, water: 400, budget: 10000, yield: 750, reqTemp: '27-35 °C', reqHumidity: '65-70 %', risk: 'Leaf spot and rust', advantage: 'Improves soil fertility.' },
    lentil: { duration: 110, price: 75, water: 350, budget: 8500, yield: 900, reqTemp: '24-26 °C', reqHumidity: '60-65 %', risk: 'Rust and wilt are common', advantage: 'Good winter crop.' },
    pomegranate: { duration: 1095, price: 120, water: 800, budget: 50000, yield: 8000, reqTemp: '25-35 °C', reqHumidity: '90-95 %', risk: 'Bacterial blight', advantage: 'High market value.' },
    banana: { duration: 365, price: 30, water: 1000, budget: 40000, yield: 25000, reqTemp: '26-28 °C', reqHumidity: '80-85 %', risk: 'Panama disease', advantage: 'Year-round production.' },
    mango: { duration: 1825, price: 80, water: 700, budget: 60000, yield: 10000, reqTemp: '24-27 °C', reqHumidity: '50-55 %', risk: 'Mango malformation', advantage: 'King of fruits, high demand.' },
    grapes: { duration: 730, price: 100, water: 900, budget: 70000, yield: 12000, reqTemp: '25-32 °C', reqHumidity: '80-85 %', risk: 'Downy mildew', advantage: 'Used for wine and table.' },
    watermelon: { duration: 80, price: 10, water: 500, budget: 12000, yield: 20000, reqTemp: '24-26 °C', reqHumidity: '80-85 %', risk: 'Fusarium wilt', advantage: 'Popular summer fruit.' },
    muskmelon: { duration: 70, price: 25, water: 450, budget: 11000, yield: 18000, reqTemp: '27-30 °C', reqHumidity: '85-90 %', risk: 'Powdery mildew', advantage: 'Refreshing and aromatic.' },
    apple: { duration: 1825, price: 150, water: 800, budget: 100000, yield: 15000, reqTemp: '21-24 °C', reqHumidity: '90-95 %', risk: 'Apple scab', advantage: 'High profitability in temperate zones.' },
    orange: { duration: 1095, price: 60, water: 750, budget: 55000, yield: 17000, reqTemp: '20-30 °C', reqHumidity: '90-95 %', risk: 'Citrus canker', advantage: 'Rich in Vitamin C.' },
    papaya: { duration: 270, price: 40, water: 900, budget: 20000, yield: 30000, reqTemp: '25-35 °C', reqHumidity: '90-95 %', risk: 'Papaya ring spot virus', advantage: 'Quick returns.' },
    coconut: { duration: 2555, price: 40, water: 1300, budget: 80000, yield: 10000, reqTemp: '27-29 °C', reqHumidity: '90-95 %', risk: 'Root wilt disease', advantage: 'Multiple uses (oil, water, fruit).' },
    cotton: { duration: 180, price: 60, water: 800, budget: 25000, yield: 1500, reqTemp: '28-30 °C', reqHumidity: '75-80 %', risk: 'Bollworm attacks', advantage: 'Important cash crop.' },
    jute: { duration: 120, price: 45, water: 1000, budget: 18000, yield: 2500, reqTemp: '25-27 °C', reqHumidity: '70-90 %', risk: 'Stem rot', advantage: 'Biodegradable fiber.' },
    coffee: { duration: 1460, price: 250, water: 900, budget: 90000, yield: 500, reqTemp: '20-28 °C', reqHumidity: '90-95 %', risk: 'Coffee leaf rust', advantage: 'High-value beverage crop.' },
    Default: { duration: 100, price: 30, water: 500, budget: 10000, yield: 1000, reqTemp: '20-30 °C', reqHumidity: '60-80 %', risk: 'General pest and disease risks', advantage: 'Standard crop benefits.' }
};


// --- 4. HELPER & EXPORTED FUNCTIONS ---

exports.getCropDuration = (cropName) => (cropDetails[cropName.toLowerCase()] || cropDetails.Default).duration;

exports.getCropInfo = (cropName, landAreaSqFt) => {
    const details = cropDetails[cropName.toLowerCase()] || cropDetails.Default;
    const landAreaAcres = landAreaSqFt / 43560; // Convert sq ft to acres

    const totalEstimatedYield = details.yield * landAreaAcres;
    const estimatedPrice = details.price * 1.1; // Using the estimated future price
    const totalEstimatedRevenue = totalEstimatedYield * estimatedPrice;

    return {
        name: cropName,
        currentPrice: `₹${details.price}/kg`,
        estimatedPrice: `₹${estimatedPrice.toFixed(2)}/kg`,
        riskFactors: details.risk,
        advantages: details.advantage,
        waterRequirement: `${(details.water * landAreaAcres).toFixed(2)} megaliters/season`,
        budgetRequirement: `₹${(details.budget * landAreaAcres).toLocaleString('en-IN')}/season`,
        tentativeHarvest: `Approx. ${details.duration} days from sowing`,
        reqTemp: details.reqTemp,
        reqHumidity: details.reqHumidity,
        totalEstimatedYield: `${totalEstimatedYield.toFixed(2)} kg`,
        totalEstimatedRevenue: `₹${totalEstimatedRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
    };
};

exports.getCropTimeline = (cropName) => {
    const duration = exports.getCropDuration(cropName);
    // Timeline dates are a percentage of the total duration, making them accurate for any crop.
    return [
        { task: 'Sow Seeds', day: 0 },
        { task: 'Germination & Early Growth', day: Math.round(duration * 0.10) },
        { task: 'Fertilizer Application', day: Math.round(duration * 0.25) },
        { task: 'Pest & Disease Inspection', day: Math.round(duration * 0.50) },
        { task: 'Flowering & Pollination', day: Math.round(duration * 0.70) },
        { task: 'Final Ripening', day: Math.round(duration * 0.90) },
        { task: 'Harvest', day: duration }
    ];
};