const express = require('express');
const router = express.Router();
const User = require('../../models/users/user');

// Get All Service Providers (with pagination)
router.get('/show', async (req, res) => {
    const { page = 1, limit = 50 } = req.query;

    try {
        const data = await User.find({ role: "Service Provider" })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await User.countDocuments({ role: "Service Provider" });

        res.json({
            totalItems: count,
            data,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page)
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error" });
    }
});

// 🔍 Get Service Providers by category
router.get('/category/:category', async (req, res) => {
    const { category } = req.params;
    try {
        const providers = await User.find({ role: "Service Provider", category: category });
        res.status(200).json(providers);
    } catch (err) {
        res.status(500).json({ error: "Server Error" });
    }
});

// 🔍 Get Service Providers by City
router.get('/city/:city', async (req, res) => {
    const { city } = req.params;
    try {
        const providers = await User.find({ role: "Service Provider", city: city });
        res.status(200).json(providers);
    } catch (err) {
        res.status(500).json({ error: "Server Error" });
    }
});

// 💰 Get Service Providers by Pricing Range
router.get('/pricing', async (req, res) => {
    const { min = 0, max = 10000 } = req.query;

    try {
        const providers = await User.find({
            role: "Service Provider",
            pricing: { $exists: true, $ne: "" } // Ensure pricing field exists
        });

        // Filter numeric pricing manually (because pricing is a string in the model)
        const filtered = providers.filter(p => {
            const price = parseFloat(p.pricing);
            return !isNaN(price) && price >= parseFloat(min) && price <= parseFloat(max);
        });

        res.status(200).json(filtered);
    } catch (err) {
        res.status(500).json({ error: "Server Error" });
    }
});

// ⏰ Get Service Providers by Availability
router.get('/availability/:availability', async (req, res) => {
    const { availability } = req.params;
    try {
        const providers = await User.find({ role: "Service Provider", availability: availability });
        res.status(200).json(providers);
    } catch (err) {
        res.status(500).json({ error: "Server Error" });
    }
});

// 🎓 Get Service Providers by Experience
router.get('/experience/:years', async (req, res) => {
    const { years } = req.params;

    try {
        const providers = await User.find({
            role: "Service Provider",
            experience: { $exists: true, $ne: "" }
        });

        // Filter numeric experience
        const filtered = providers.filter(p => {
            const exp = parseFloat(p.experience);
            return !isNaN(exp) && exp >= parseFloat(years);
        });

        res.status(200).json(filtered);
    } catch (err) {
        res.status(500).json({ error: "Server Error" });
    }
});

// 📌 Get Service Provider by ID 
router.get('/getinfo/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user || user.role !== 'Service Provider') {
            return res.status(404).json({ success: false, error: "Service Provider not found" });
        }
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Server error" });
    }
});


// Get distinct values for filters (city, pricing, availability, experience)
router.get('/filters', async (req, res) => {
    try {
        const cities = await User.distinct("city", { role: "Service Provider" });
        const pricing = await User.distinct("pricing", { role: "Service Provider" });
        const availability = await User.distinct("availability", { role: "Service Provider" });
        const experience = await User.distinct("experience", { role: "Service Provider" });

        res.json({ cities, pricing, availability, experience });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Failed to fetch filter data" });
    }
});


// GET: Filtered Service Providers
router.get('/filter', async (req, res) => {
    const { category, city, pricing, availability, experience } = req.query;

    try {
        const query = { role: "Service Provider" };

        if (city) query.city = city;
        if (category) query.category = category;
        if (pricing) query.pricing = pricing;
        if (availability) query.availability = availability;
        if (experience) query.experience = experience;

        const providers = await User.find(query);
        res.status(200).json({ success: true, data: providers });
    } catch (error) {
        console.error("Error in filter API:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});


module.exports = router;
