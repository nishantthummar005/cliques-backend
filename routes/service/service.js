const express = require("express");
const mongoose = require('mongoose'); 
const router = express.Router();
const Service = require("../../models/services/service");
const { body, validationResult } = require('express-validator');
const admindata = require("../../middleware/userdata"); // for token
const multer = require("multer"); // for file upload
const path = require("path"); // for upload path
const fs = require("fs"); // file system

const { dirname } = require('path');
const appDir = dirname(require.main.filename);


/*
 * _______________ SINGLE FILE UPLOAD START _______________
 */

const storageEngine = multer.diskStorage({
    destination: "../public/upload/service/",
    filename: function (req, file, callback) {
        // callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));  // if you want to give same extension of file
        callback(null, file.fieldname + "-" + Date.now() + ".webp"); // change extension to webp
    },
});

// file filter for multer
const fileFilter = (req, file, callback) => {
    let pattern = /jpg|png|jpeg|webp|svg/; // reqex
    if (pattern.test(path.extname(file.originalname))) {
        callback(null, true);
    } else {
        callback("Error: not a valid file");
    }
};

// initialize multer
const upload = multer({
    storage: storageEngine,
    fileFilter: fileFilter,
});

/*
 * _______________ SINGLE FILE UPLOAD END _______________
 */

/*
 * _______________ MULTI FILE UPLOAD START _______________
 */
const storage = multer.diskStorage({
    destination: "../public/upload/service/",
    filename: function (req, file, cb) {
        cb(
            null,
            file.fieldname + "-" + Date.now() + ".webp"
        );
    },
});

const multi_upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (
            file.mimetype == "image/png" ||
            file.mimetype == "image/jpg" ||
            file.mimetype == "image/jpeg"
        ) {
            cb(null, true);
        } else {
            cb(null, false);
            const err = new Error("Only .png, .jpg and .jpeg format allowed!");
            err.name = "ExtensionError";
            return cb(err);
        }
    },
}).array("images", 10);

/*
 * _______________ MULTI FILE UPLOAD END _______________
 */

// Add Service Controller
router.post("/add", admindata, (req, res) => {
    multi_upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading.
            res.status(500).send({ error: { message: `Multer uploading error: ${err.message}` } }).end();
            return;
        } else if (err) {
            // An unknown error occurred when uploading.
            if (err.name == 'ExtensionError') {
                res.status(413).send({ error: { message: err.message } }).end();
            } else {
                res.status(500).send({ error: { message: `unknown uploading error: ${err.message}` } }).end();
            }
            return;
        }

        // Product photos in an array and insert into a table
        const newUpload = new Array();
        req.files.map(async (file) => {
            newUpload.push((file) ? '/upload/service/' + file.filename : '');
        })

        try {
            Service.create({
                category: (req.body.category) ? req.body.category : '',
                title: (req.body.title) ? req.body.title : '',
                description: (req.body.description) ? req.body.description : '',
                duties: (req.body.duties) ? req.body.duties : '',
                availability: (req.body.availability) ? req.body.availability : '',
                images: (newUpload ? newUpload : []),
                price: (req.body.price) ? req.body.price : ''
            }).then(
                res.status(200).send({ success: true, message: "Yeah, data added successfully." })
            ).catch(
                err => console.log(err.message)
            );

        } catch (error) {
            res.status(500).send({ success: false, error: "Oops, some error occured during service!" });
        }
    })
});

// Update Service Controller using PUT method
router.put("/update/:id", multer().any(), [
    body('category').notEmpty(),
    body('title').notEmpty(),
    body('description').notEmpty(),
    body('duties').notEmpty(),
    body('availability').notEmpty(),
    body('price').notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        console.log(req.body);
        const { category, title, description, duties, availability, price } = req.body;

        // to get ID from PUT method
        const service_id = req.params.id;
        // find which admin password to be updated and then update it.
        let serviceData = await Service.findById(service_id);
        if (!serviceData) {
            return res
                .status(400)
                .json({ success, error: "Oops, data not found!" });
        }
        // create a new object of note
        const newData = {
            category: category ? category : serviceData.category,
            title: title ? title : serviceData.title,
            description: description ? description : serviceData.description,
            duties: duties ? duties : serviceData.duties,
            availability: availability ? availability : serviceData.availability,
            price: price ? price : serviceData.price
        };

        // update servicesData by service id and return it to response
        serviceData = await Service.findByIdAndUpdate(
            service_id,
            { $set: newData },
            { new: true }
        );
        if (serviceData) {
            return res.status(200).json({
                success: true,
                message: "Data has been changed successfully.",
            });
        }
    } catch (error) {
        res
            .status(500)
            .send({ success: false, error: "Oops, internal server error!" });
    }
}
);


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
            { $unwind: { path: "$categoryDetails", preserveNullAndEmptyArrays: true } } 
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


// Delete Service Controller
router.delete("/delete/:id", admindata, async (req, res) => {
    try {
        // to get ID from PUT method
        const service_id = req.params.id;

        // find which service to be deleted and then update it.
        let service = await Service.findById(service_id);
        if (!service) {
            return res.status(404).send({ error: "Oops, data not found!" });
        }

        if (service.images) {
            service.images.map(async (file) => {
                fs.unlinkSync('../public' + file); // remove photo
            })
        }
        // update note by service id and return it to response
        service = await Service.findByIdAndDelete(service_id);
        res
            .status(200)
            .json({ success: true, message: "Service item has been deleted." });
    } catch (error) {
        res
            .status(500)
            .send({ success: false, error: "Oops, internal server error!" });
    }
});

module.exports = router;
