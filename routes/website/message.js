const express = require("express");
const router = express.Router();
const Message = require("../../models/users/Message");
const Appointment = require("../../models/users/appointment"); // Make sure this model is imported


// Get chat messages by appointment ID
router.get("/messages/:appointmentId", async (req, res) => {
    const { appointmentId } = req.params;

    try {
        const messages = await Message.find({ appointmentId })
            .populate("sender", "name _id")
            .populate("receiver", "name _id")
            .sort({ timestamp: 1 });

        res.json({ success: true, messages });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET chat history between two users
router.get("/provider-messages/:user1/:user2", async (req, res) => {
    const { user1, user2 } = req.params;
    try {
        const messages = await Message.find({
            $or: [
                { sender: user1, receiver: user2 },
                { sender: user2, receiver: user1 },
            ],
        })
            .sort({ timestamp: 1 })
            .populate("sender", "name _id")
            .exec();

        res.json({ success: true, messages });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});



// GET all unique clients who have chatted with a service provider 
router.get("/clients/:providerId", async (req, res) => {
    const { providerId } = req.params;

    try {
        const messages = await Message.find({ receiver: providerId })
            .populate("sender", "name email")
            .exec();

        const uniqueClientsMap = {};
        const clientList = [];

        for (const msg of messages) {
            const client = msg.sender;

            if (client && !uniqueClientsMap[client._id]) {
                // Find the appointment that links this client and provider
                const appointment = await Appointment.findOne({
                    client: client._id,
                    serviceProvider: providerId
                }).select("_id"); // Only need appointment ID

                clientList.push({
                    _id: client._id,
                    name: client.name,
                    email: client.email,
                    appointmentId: appointment?._id || null // null if not found
                });

                uniqueClientsMap[client._id] = true;
            }
        }

        res.json({ success: true, clients: clientList });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});



// POST new chat message
router.post("/send", async (req, res) => {
    const { appointmentId, sender, receiver, message } = req.body;

    if (!appointmentId || !sender || !receiver || !message) {
        return res.status(400).json({ error: "All fields are required." });
    }

    try {
        const newMessage = new Message({
            appointmentId,
            sender,    // sender = ObjectId of User
            receiver,  // receiver = ObjectId of User
            content: message
        });

        // Save the message first
        await newMessage.save();

        // Re-fetch it with population
        const populatedMsg = await Message.findById(newMessage._id)
            .populate("sender", "name email role")
            .populate("receiver", "name email role");

        res.json(populatedMsg);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



module.exports = router;
