const express = require('express');
const router = express.Router();
const Ticket = require('../../models/users/ticket');
const mongoose = require('mongoose');

// Add a new ticket
router.post('/add', async (req, res) => {
    try {
        const { client, appointment, message } = req.body;

        if (!client || !appointment) {
            return res.status(400).json({ success: false, message: "Client and Appointment are required" });
        }

        const ticket = new Ticket({
            client,
            appointment,
            message
        });

        const savedTicket = await ticket.save();
        res.status(201).json({ success: true, data: savedTicket });

    } catch (err) {
        console.error("Error creating ticket:", err.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

// Update ticket status
router.put('/update-status/:id', async (req, res) => {
    try {
        const ticketId = req.params.id;
        const { status } = req.body;

        if (!['Active', 'Completed', 'Cancelled'].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status value" });
        }

        const updated = await Ticket.findByIdAndUpdate(ticketId, { status }, { new: true });

        if (!updated) {
            return res.status(404).json({ success: false, message: "Ticket not found" });
        }

        res.status(200).json({ success: true, data: updated });

    } catch (err) {
        console.error("Error updating ticket status:", err.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

// Send to Admin
router.put('/sendtoadmin/:id', async (req, res) => {
    try {
        const ticketId = req.params.id;
        const { status } = req.body;

        if (!['Send To Admin'].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status value" });
        }

        const updated = await Ticket.findByIdAndUpdate(ticketId, { status }, { new: true });

        if (!updated) {
            return res.status(404).json({ success: false, message: "Ticket not found" });
        }

        res.status(200).json({ success: true, data: updated });

    } catch (err) {
        console.error("Error updating ticket status:", err.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

// ✅ Get tickets by client with full appointment + serviceProvider details
router.get('/client/:clientId', async (req, res) => {
    try {
        const { clientId } = req.params;

        const tickets = await Ticket.aggregate([
            {
                $match: { client: new mongoose.Types.ObjectId(clientId) }
            },
            {
                $lookup: {
                    from: 'appointments',
                    localField: 'appointment',
                    foreignField: '_id',
                    as: 'appointment'
                }
            },
            {
                $unwind: '$appointment'
            },
            {
                $lookup: {
                    from: 'users', // assuming your user collection is named 'users'
                    localField: 'appointment.serviceProvider',
                    foreignField: '_id',
                    as: 'appointment.serviceProvider'
                }
            },
            {
                $unwind: {
                    path: '$appointment.serviceProvider',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $sort: { createdAt: -1 }
            }
        ]);

        res.status(200).json({ success: true, data: tickets });

    } catch (err) {
        console.error("Error fetching client tickets:", err.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

// ✅ Get all tickets with full client, appointment, and serviceProvider details
router.get('/all', async (req, res) => {
    try {
        const tickets = await Ticket.aggregate([
            // Lookup Appointment details
            {
                $lookup: {
                    from: 'appointments',
                    localField: 'appointment',
                    foreignField: '_id',
                    as: 'appointment'
                }
            },
            {
                $unwind: '$appointment'
            },
            // Lookup Client details
            {
                $lookup: {
                    from: 'users',
                    localField: 'client',
                    foreignField: '_id',
                    as: 'client'
                }
            },
            {
                $unwind: '$client'
            },
            // Lookup Service Provider details from appointment.serviceProvider
            {
                $lookup: {
                    from: 'users',
                    localField: 'appointment.serviceProvider',
                    foreignField: '_id',
                    as: 'appointment.serviceProvider'
                }
            },
            {
                $unwind: {
                    path: '$appointment.serviceProvider',
                    preserveNullAndEmptyArrays: true
                }
            },
            // Sort by latest tickets
            {
                $sort: { createdAt: -1 }
            }
        ]);

        res.status(200).json({ success: true, data: tickets });

    } catch (err) {
        console.error("Error fetching all tickets:", err.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

// ✅ Get tickets with status "Send To Admin" including full client, appointment, and serviceProvider details
router.get('/admin-tickets', async (req, res) => {
    try {
        const tickets = await Ticket.aggregate([
            {
                $match: { status: "Send To Admin" }
            },
            // Lookup Appointment details
            {
                $lookup: {
                    from: 'appointments',
                    localField: 'appointment',
                    foreignField: '_id',
                    as: 'appointment'
                }
            },
            {
                $unwind: '$appointment'
            },
            // Lookup Client details
            {
                $lookup: {
                    from: 'users',
                    localField: 'client',
                    foreignField: '_id',
                    as: 'client'
                }
            },
            {
                $unwind: '$client'
            },
            // Lookup Service Provider details
            {
                $lookup: {
                    from: 'users',
                    localField: 'appointment.serviceProvider',
                    foreignField: '_id',
                    as: 'appointment.serviceProvider'
                }
            },
            {
                $unwind: {
                    path: '$appointment.serviceProvider',
                    preserveNullAndEmptyArrays: true
                }
            },
            // Sort by latest tickets
            {
                $sort: { createdAt: -1 }
            }
        ]);

        res.status(200).json({ success: true, data: tickets });
    } catch (err) {
        console.error("Error fetching admin tickets:", err.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});



// Delete a ticket
router.delete('/delete/:id', async (req, res) => {
    try {
        const ticketId = req.params.id;

        const deleted = await Ticket.findByIdAndDelete(ticketId);

        if (!deleted) {
            return res.status(404).json({ success: false, message: "Ticket not found" });
        }

        res.status(200).json({ success: true, message: "Ticket deleted successfully" });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

module.exports = router;
