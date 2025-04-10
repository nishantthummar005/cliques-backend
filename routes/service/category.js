const express = require('express');
const router = express.Router();
const Category = require('../../models/services/category'); 
const admindata = require("../../middleware/userdata");  // for token 

// Add Category Controller
router.post('/add', admindata, async (req, res) => {
    const { name, description } = req.body;

    if (!name || !description) {
        return res.status(400).send({
            success: false,
            error: "Name and description are required."
        });
    }

    try {
        const category = await Category.create({ name, description });

        res.status(200).send({
            success: true,
            message: "Yeah, data added successfully.",
            category
        });
    } catch (error) {
        console.error("Add Category Error:", error);
        res.status(500).send({
            success: false,
            error: "Oops, some error occurred during category creation!",
            message: error.message
        });
    }
});

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

// Update Category Controller using PUT method
router.put('/updatecategory/:id', admindata, async (req, res) => {
    try {
        // get the title and message from request body
        const { name, description } = req.body;

        // to get ID from PUT method
        const category_id = req.params.id;
        // find which admin password to be updated and then update it.
        let categoryData = await Category.findById(category_id);
        if (!categoryData) { return res.status(400).json({ success, error: "Oops, data not found!" }); }
         
        // create a new object of note
        const newData = {
            name: (name) ? name : categoryData.name, 
            description: (description) ? description : categoryData.description
        };
        // update categorysData by category id and return it to response
        categoryData = await Category.findByIdAndUpdate(category_id, { $set: newData }, { new: true });
        if (categoryData) {
            return res.status(200).json({ success: true, message: "Data has been changed successfully." });
        }
    } catch (error) {
        res.status(500).send({ success: false, error: "Oops, internal server error!" });
    }
});

// Delete Category Controller
router.delete('/deletecategory/:id', admindata, async (req, res) => {
    try {
        // to get ID from PUT method
        const category_id = req.params.id;

        // find which category to be deleted and then update it.
        let category = await Category.findById(category_id);
        if (!category) { return res.status(404).send({ error: "Oops, data not found!" }); }
 
        // update note by category id and return it to response
        category = await Category.findByIdAndDelete(category_id);
        res.status(200).json({ success: true, message: "Category item has been deleted." });
    } catch (error) {
        res.status(500).send({ success: false, error: "Oops, internal server error!" });
    }
});

// get Editable item
router.get('/getedititem/:id', admindata, async (req, res) => {
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
