const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Appointment = require('../../models/users/appointment'); 

// GET Appointments by Client ID
router.get('/show/client/:id', async (req, res) => {
    const { page = 1, limit = 50 } = req.query;
    const clientId = req.params.id;

    try {
        const data = await Appointment.find({ client: clientId })
            .populate('client') // include full client details
            .populate('serviceProvider') // include full service provider details
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await Appointment.countDocuments({ client: clientId });

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


// GET Appointments by Service Provider ID
router.get('/show/provider/:id', async (req, res) => {
    const { page = 1, limit = 50 } = req.query;
    const providerId = req.params.id;

    try {
        const data = await Appointment.find({ serviceProvider: providerId })
            .populate('client') // include full client details
            .populate('serviceProvider') // include full service provider details
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await Appointment.countDocuments({ serviceProvider: providerId });

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


// GET Total Earnings by Date for a Service Provider
router.get('/earnings/provider/:id', async (req, res) => {
    const providerId = req.params.id;

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const earnings = await Appointment.aggregate([
            {
                $match: {
                    serviceProvider: new mongoose.Types.ObjectId(providerId),
                    status: { $ne: "Cancelled" }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$appointment_datetime" }
                    },
                    totalEarnings: { $sum: "$fees" }
                }
            },
            {
                $sort: { _id: 1 }
            },
            {
                $project: {
                    date: "$_id",
                    totalEarnings: 1,
                    _id: 0
                }
            }
        ]);

        // Calculate all time total
        const totalEarnings = earnings.reduce((acc, item) => acc + item.totalEarnings, 0);

        // Get today's earnings
        const todayStr = today.toISOString().split("T")[0];
        const todayEarningsObj = earnings.find(e => e.date === todayStr);
        const todayEarnings = todayEarningsObj ? todayEarningsObj.totalEarnings : 0;

        res.json({
            dailyEarnings: earnings,
            totalEarnings,
            todayEarnings
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});



// GET a Single Appointment by ID
router.get('/getinfo/:id', async (req, res) => {
    try {
        const appointmentId = req.params.id;

        const appointment = await Appointment.findById(appointmentId)
            .populate('client')
            .populate('serviceProvider');

        if (!appointment) {
            return res.status(404).send({ success: false, error: "Oops, data not found!" });
        }

        res.status(200).send(appointment);
    } catch (error) {
        console.error(error.message);
        res.status(500).send({ success: false, error: "Oops, internal server error!" });
    }
});


// Create a new appointment
router.post('/add', async (req, res) => {
    try {
        const {
            client,
            serviceProvider,
            name,
            email,
            phone,
            address,
            appointment_date,
            appointment_time,
            fees,
            card_name,
            card_number,
            card_expiry,
            card_cvv
        } = req.body;

        // Validate required fields
        if (!client || !serviceProvider || !name || !email || !phone || !appointment_date || !appointment_time || !fees) {
            return res.status(400).json({ success: false, message: "Missing required fields." });
        }

        // Combine date and time into a single Date object
        const appointment_datetime = new Date(`${appointment_date}T${appointment_time}`);

        const appointment = new Appointment({
            client,
            serviceProvider,
            name,
            email,
            phone,
            address,
            appointment_datetime, // ✅ combined date-time
            fees,
            card_name,
            card_number,
            card_expiry,
            card_cvv
        });

        await appointment.save();

        res.status(201).json({ success: true, message: "Appointment created successfully!", data: appointment });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});


// Update status and datetime 
router.put('/update/:id', async (req, res) => {
    try {
        const updated = await Appointment.findByIdAndUpdate(
            req.params.id,
            {
                $set: req.body  // Ensure only the fields you pass are updated
            },
            { new: true } // Return the updated document
        );

        if (!updated) {
            return res.status(404).json({ success: false, message: "Appointment not found." });
        }

        res.json({ success: true, data: updated });
    } catch (err) {
        console.error("Update error:", err.message);
        res.status(500).json({ success: false, message: "Update failed." });
    }
});



// Update an existing appointment
router.put('/updateAppointment/:id', async (req, res) => {
    try {
        const appointmentId = req.params.id;
        const updateData = req.body;

        // Optional: Validate updateData fields here

        const updated = await Appointment.findByIdAndUpdate(appointmentId, updateData, {
            new: true,
            runValidators: true
        });

        if (!updated) {
            return res.status(404).json({ success: false, message: "Appointment not found" });
        }

        res.status(200).json({ success: true, message: "Appointment updated successfully", data: updated });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});


// Delete an appointment
router.delete('/delete/:id', async (req, res) => {
    try {
        const appointmentId = req.params.id;

        const deleted = await Appointment.findByIdAndDelete(appointmentId);

        if (!deleted) {
            return res.status(404).json({ success: false, message: "Appointment not found" });
        }

        res.status(200).json({ success: true, message: "Appointment deleted successfully" });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});


module.exports = router
