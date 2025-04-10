const express = require('express');
const router = express.Router();
const User = require('../../models/users/user');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SIGN = "commonAdmin";
const userdata = require("../../middleware/userdata");
const multer = require("multer");
const path = require('path');
const fs = require('fs');    // file system


// Get All Users Data Controller 
router.get('/show', async (req, res) => {
    try {
        const usersData = await User.find();
        res.send(usersData);
    } catch (error) {
        console.error(error.message);
        res.status(500).send({ error: "Oops, some error occured while fetching contacts!" });
    }
});
 
// Delete User Controller
router.delete('/delete/:id', async (req, res) => {
    try {
        // to get ID from PUT method
        const user_id = req.params.id;

        // find which user to be deleted and then update it.
        let user = await User.findById(user_id);
        if (!user) { return res.status(404).send({ error: "Oops, data not found!" }); }

        // update note by user id and return it to response
        user = await User.findByIdAndDelete(user_id);
        res.status(200).json({ success: true, message: "User has been deleted." });
    } catch (error) {
        res.status(500).send({ success: false, error: "Oops, internal server error!" });
    }
});

// Suspend or Activate User
router.put('/status/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const { status } = req.body; // expected to be 'Active' or 'Suspended'

        // Validate status
        const validStatuses = ["Active", "Suspended"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, error: "Invalid status value." });
        }

        // Find user by ID
        let user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: "User not found." });
        }

        // Update status
        user.status = status;
        await user.save();

        res.status(200).json({ success: true, message: `User account has been ${status.toLowerCase()}.` });
    } catch (error) {
        console.error("Status update error:", error);
        res.status(500).json({ success: false, error: "Internal server error." });
    }
});


// Admin Register controller
router.post('/register', [
    body('name').notEmpty(),
    body('role').notEmpty(),
    body('email').notEmpty().isEmail(),
    body('phone').notEmpty().isLength({ min: 10, max: 12 }),
    body('password')
        .isLength({ min: 8 })
        .withMessage('must be at least 8 chars long'),
    body('address').notEmpty(),
    body('city').notEmpty()
], async (req, res) => {
    // check the validation and return message to response
    const errors = validationResult(req);
    let success = false;
    if (!errors.isEmpty()) {
        return res.status(400).json({ success, error: errors.array() });
    }
    try {
        // check whether the admin is exist with same email
        let admin = await User.findOne({ email: req.body.email })
        if (admin) {
            return res.status(409).json({ success, error: "Sorry, admin already exist with the same email!" });
        }

        // Encrypt Password by salt and hash
        var salt = await bcrypt.genSaltSync(10);
        var secPass = await bcrypt.hashSync(req.body.password, salt);

        // storing admin data to register table
        admin = await User.create({
            role: req.body.role,
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            password: secPass,
            address: req.body.address,
            city: req.body.city
        })

        // Generate Json Web Token (JWT) for authentication & send Token to response
        const adminID = {
            admin: {
                id: admin.id
            }
        }
        success = true;
        const authToken = jwt.sign(adminID, JWT_SIGN);
        res.json({ success, authToken });  // send Token to response 
    } catch (error) {
        res.status(500).send({
            success,
            error: "Oops, some error occurred during registering an admin.",
            message: error.message  // Send the actual error message
        });
    }
});

// Admin Login Controller
router.post('/login', [
    body('email')
        .isEmail()
        .withMessage('Enter valid email address')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 8 })
        .withMessage('must be at least 8 chars long')
], async (req, res) => {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success, error: errors.array() });
    }

    try {
        const { email, password } = req.body;

        // check whether the admin exists
        let admin = await User.findOne({ email });
        if (!admin) {
            return res.status(400).json({ success, error: "Please try to login with correct credentials!" });
        }

        // ❗ Check if account is suspended
        if (admin.status === "Suspended") {
            return res.status(403).json({ success, error: "Your account has been suspended. Please contact support." });
        }

        // Check password
        const passCompare = await bcrypt.compare(password, admin.password);
        if (!passCompare) {
            return res.status(400).json({ success, error: "Please try to login with correct credentials!" });
        }

        // Generate JWT
        const adminID = {
            admin: {
                id: admin.id
            }
        };
        const authToken = jwt.sign(adminID, JWT_SIGN);
        success = true;

        res.status(200).json({ success, authToken });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).send({ success, error: "Oops, some error occurred during login!" });
    }
});


// Get Admin Data controller using Authentication Token
router.get('/getuser', userdata, async (req, res) => {
    let success = false;
    try {
        // get request admin id from middleware
        const adminid = req.admin.id;
        // fetch admindata accept password from table using adminID
        const admin = await User.findById(adminid).select("-password");
        if (!admin) {
            res.status(400).json({ success, error: "Sorry, data not found!" });  // send admindata to response 
        } else {
            success = true
            res.status(200).json({ success, admin });  // send admindata to response 
        }
    } catch (error) {
        res.status(500).send({ success, error: "Oops, internal server error!" });
    }
});

// Update Password Data 
router.put('/update/:id', userdata, [
    body('password')
        .isLength({ min: 8 })
        .withMessage('must be at least 8 chars long'),
    body('new_password')
        .isLength({ min: 8 })
        .withMessage('must be at least 8 chars long')
], async (req, res) => {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success, error: errors.array() });
    }
    try {
        // get request admin id from middleware
        // const adminTokenid = req.admin.id;

        // get the password from request body
        const { new_password, password } = req.body;

        // to get ID from PUT method
        const admin_id = req.params.id;
        // find which admin password to be updated and then update it.
        let adminData = await User.findById(admin_id);
        if (!adminData) { return res.status(400).json({ success, error: "Oops, data not found!" }); }

        // Decrypt Password by salt and hash 
        const passCompare = await bcrypt.compare(password, adminData.password);
        if (!passCompare) {
            return res.status(400).json({ success, error: "Please try to enter correct password!" });
        }

        // Encrypt Password by salt and hash
        var salt = await bcrypt.genSaltSync(10);
        var secPass = await bcrypt.hashSync(new_password, salt);

        // create a new object of updatable Data
        const updatedData = {};
        (secPass) ? updatedData.password = secPass : '';

        // update admin record by admin_id and return it to response
        adminData = await User.findByIdAndUpdate(admin_id, { $set: updatedData }, { new: true });
        if (adminData) {
            success = true;
            return res.status(200).json({ success, message: "Password has been changed successfully." });
        }

    } catch (error) {
        res.status(500).send({ success, error: "Oops, internal server error!" });
    }
});


const storageEngine = multer.diskStorage({
    destination: '../public/upload/admin/',
    filename: function (req, file, callback) {
        // callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));  // if you want to give same extension of file
        callback(null, file.fieldname + '-' + Date.now() + ".webp");  // change extension to webp 
    },
});

// file filter for multer
const fileFilter = (req, file, callback) => {
    let pattern = /jpg|png|jpeg|webp|svg/; // reqex
    if (pattern.test(path.extname(file.originalname))) {
        callback(null, true);
    } else {
        callback('Error: not a valid file');
    }
};

// initialize multer
const upload = multer({
    storage: storageEngine,
    fileFilter: fileFilter,
});

// Update Profile & Other Detail
router.put('/updateinfo/:id', userdata, upload.single('profilePicture'), [
    body('name').notEmpty(),
    body('phone').notEmpty().isLength({ min: 10, max: 12 }),
    body('address').notEmpty(),
    body('city').notEmpty()
], async (req, res) => {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success, error: errors.array() });
    }
    try {
        const { name, phone, address, city } = req.body;
        const admin_id = req.params.id;

        // Find the user
        let adminData = await User.findById(admin_id);
        if (!adminData) {
            return res.status(400).json({ success, error: "Oops, data not found!" });
        }

        // Delete old profile picture if a new one is uploaded
        if (req.file && adminData.profilePicture) {
            const oldImagePath = path.join(__dirname, "..", "../../public", adminData.profilePicture.replace(/^\//, "")); // Remove leading "/"

            if (fs.existsSync(oldImagePath)) {
                fs.unlink(oldImagePath, (err) => {
                    if (err) {
                        console.error("Error deleting old profile picture:", err);
                    } else {
                        console.log("Old profile picture deleted successfully.");
                    }
                });
            } else {
                console.log("Old profile picture not found:", oldImagePath);
            }
        }


        // Construct the updated data object
        const updatedData = {
            name,
            phone,
            address,
            city
        };

        // Only update profile picture if a new file is uploaded
        if (req.file) {
            updatedData.profilePicture = `/upload/admin/${req.file.filename}`;
        }

        // Update user data
        adminData = await User.findByIdAndUpdate(admin_id, { $set: updatedData }, { new: true });

        if (adminData) {
            success = true;
            return res.status(200).json({ success, message: "Data has been changed successfully.", adminData });
        }

    } catch (error) {
        console.error("Profile update error:", error);
        res.status(500).send({ success, error: "Oops, internal server error!" });
    }
});


// Service Provider - Update Other Detail
router.put('/updateotherinfo/:id', userdata, upload.single('identityProof'), [
    body('category').notEmpty(),
    body('availability').notEmpty(),
    body('experience').notEmpty(),
    body('skills').notEmpty(),
    body('pricing').notEmpty()
], async (req, res) => {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success, error: errors.array() });
    }
    try {
        const { category, availability, experience, skills, pricing } = req.body;
        const admin_id = req.params.id;

        // Find the user
        let adminData = await User.findById(admin_id);
        if (!adminData) {
            return res.status(400).json({ success, error: "Oops, data not found!" });
        }

        // Delete old ID Proof if a new one is uploaded
        if (req.file && adminData.identityProof) {
            const oldImagePath = path.join(__dirname, "..", "../../public", adminData.identityProof.replace(/^\//, "")); // Remove leading "/"

            if (fs.existsSync(oldImagePath)) {
                fs.unlink(oldImagePath, (err) => {
                    if (err) {
                        console.error("Error deleting old ID Proof:", err);
                    } else {
                        console.log("ID Proof deleted successfully.");
                    }
                });
            } else {
                console.log("ID Proof not found:", oldImagePath);
            }
        }


        // Construct the updated data object
        const updatedData = {
            category,
            availability,
            experience,
            skills,
            pricing
        };

        // Only update profile picture if a new file is uploaded
        if (req.file) {
            updatedData.identityProof = `/upload/admin/${req.file.filename}`;
        }

        // Update user data
        adminData = await User.findByIdAndUpdate(admin_id, { $set: updatedData }, { new: true });

        if (adminData) {
            success = true;
            return res.status(200).json({ success, message: "Data has been changed successfully.", adminData });
        }

    } catch (error) {
        console.error("Profile update error:", error);
        res.status(500).send({ success, error: "Oops, internal server error!" });
    }
});


module.exports = router
