const express = require('express');
const router = express.Router();
const Review = require('../../models/users/review');

// Add a new review
router.post('/add', async (req, res) => {
    try {
        const { client, appointment, serviceProvider, rating, review } = req.body;

        if (!client || !appointment || !serviceProvider) {
            return res.status(400).json({ success: false, message: "Client, appointment, and service provider are required" });
        }

        const newReview = new Review({
            client,
            appointment,
            serviceProvider,
            rating,
            review
        });

        const savedReview = await newReview.save();
        res.status(201).json({ success: true, data: savedReview });
    } catch (err) {
        console.error("Error adding review:", err.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

// Get reviews by client
router.get('/client/:clientId', async (req, res) => {
    try {
        const reviews = await Review.find({ client: req.params.clientId })
            .populate('appointment')
            .populate('serviceProvider', 'name email phone');

        res.status(200).json({ success: true, data: reviews });
    } catch (err) {
        console.error("Error fetching client reviews:", err.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

// Get reviews for a service provider
router.get('/service-provider/:providerId', async (req, res) => {
    try {
        const reviews = await Review.find({ serviceProvider: req.params.providerId })
            .populate('client', 'name email')
            .populate('appointment');

        res.status(200).json({ success: true, data: reviews });
    } catch (err) {
        console.error("Error fetching service provider reviews:", err.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

// Get reviews for a service provider
router.get('/show-review/:providerId', async (req, res) => {
    try {
        const reviews = await Review.find({ serviceProvider: req.params.providerId, status: 'Active' })
            .populate('client', 'name email')
            .populate('appointment');

        res.status(200).json({ success: true, data: reviews });
    } catch (err) {
        console.error("Error fetching service provider reviews:", err.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

// Get reviews all
router.get('/show', async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate('client', 'name email')
            .populate('appointment')
            .populate('serviceProvider', 'name email phone');

        res.status(200).json({ success: true, data: reviews });
    } catch (err) {
        console.error("Error fetching service provider reviews:", err.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

// Update review status
router.put('/update-status/:id', async (req, res) => {
    try {
        const { status } = req.body;

        if (!['Active', 'Inactive'].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status value" });
        }

        const updatedReview = await Review.findByIdAndUpdate(req.params.id, { status }, { new: true });

        if (!updatedReview) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        res.status(200).json({ success: true, data: updatedReview });
    } catch (err) {
        console.error("Error updating review status:", err.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

// Delete review
router.delete('/delete/:id', async (req, res) => {
    try {
        const deleted = await Review.findByIdAndDelete(req.params.id);

        if (!deleted) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        res.status(200).json({ success: true, message: "Review deleted successfully" });
    } catch (err) {
        console.error("Error deleting review:", err.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

module.exports = router;