const express = require("express");
const mongoose = require('mongoose');   
const router = express.Router();
const Service = require("../../models/services/service");


// Get All Service Data Controller
router.get("/show", async (req, res) => {

    // destructure page and limit and set default values
    const { page = 1, limit = 50 } = req.query;

    try {
        // execute query with page and limit values

        const pipeline = [
            {
                $lookup: {
                    from: "categories",
                    localField: "category",
                    foreignField: "_id",
                    as: "categoryDetails",
                },
            },
        ];

        const data = await Service.aggregate(pipeline)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        // get total documents in the Posts collection
        const count = await Service.countDocuments();

        // return response with totalItems, data, total pages, and current page
        res.json({
            totalItems: count,
            data,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
        });
    } catch (err) {
        console.error(err.message);
    }
});

// get Editable item
router.get('/getedititem/:id', async (req, res) => {
    try {
        const service_id = req.params.id;

        // Aggregation pipeline to fetch service by ID and include category details
        const pipeline = [
            {
                $match: { _id: new mongoose.Types.ObjectId(service_id) } // Convert string ID to ObjectId
            },
            {
                $lookup: {
                    from: "categories",   
                    localField: "category",
                    foreignField: "_id",
                    as: "categoryDetails"
                }
            },
            { $unwind: { path: "$categoryDetails", preserveNullAndEmptyArrays: true } } // Optional: Flatten categoryDetails
        ];

        const service = await Service.aggregate(pipeline);

        if (!service || service.length === 0) {
            return res.status(404).send({ success: false, error: "Oops, data not found!" });
        }

        res.status(200).send(service[0]);  // service[0] because aggregate returns an array
    } catch (error) {
        console.error("Get Edit Item Error:", error);
        res.status(500).send({ success: false, error: "Oops, internal server error!" });
    }
});

// Get services by category ID
router.get('/getservicesbycategory/:categoryId', async (req, res) => {
    try {
        const categoryId = req.params.categoryId;

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            return res.status(400).json({ success: false, error: "Invalid category ID" });
        }

        // Fetch all services matching the category
        // const services = await Service.find({ category: categoryId });

        const pipeline = [
            { $match: { category: new mongoose.Types.ObjectId(categoryId) } },
            {
                $lookup: {
                    from: "categories",
                    localField: "category",
                    foreignField: "_id",
                    as: "categoryDetails"
                }
            },
            { $unwind: "$categoryDetails" }
        ];
        const services = await Service.aggregate(pipeline);

        if (!services || services.length === 0) {
            return res.status(404).json({ success: false, error: "No services found for this category." });
        }

        res.status(200).json({ success: true, services });
    } catch (error) {
        console.error("Error fetching services by category:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});

module.exports = router;
