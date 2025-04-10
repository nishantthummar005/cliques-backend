const express = require('express');
const router = express.Router();
const Category = require('../../models/services/category');


// Get All Category Data Controller
router.get('/show', async (req, res) => {
    // destructure page and limit and set default values
    const { page = 1, limit = 50 } = req.query;

    try {
        // execute query with page and limit values
        const data = await Category.find()
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        // get total documents in the Posts collection 
        const count = await Category.countDocuments();

        // return response with totalItems, data, total pages, and current page
        res.json({
            totalItems: count,
            data,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (err) {
        console.error(err.message);
    }
});

// get Editable item
router.get('/getedititem/:id', async (req, res) => {
    try {
        // to get ID from PUT method
        const category_id = req.params.id;

        // find which category to be deleted and then update it.
        let category = await Category.findById(category_id);
        if (!category) { return res.status(404).send({ success: false, error: "Oops, data not found!" }); }

        res.status(200).send(category);
    } catch (error) {
        res.status(500).send({ success: false, error: "Oops, internal server error!" });
    }
});

module.exports = router
