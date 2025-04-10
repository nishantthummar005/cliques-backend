const mongoose = require('mongoose');
const { Schema } = mongoose;

const ticketSchema = new Schema({
    client: {
        type: Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    appointment: {
        type: Schema.Types.ObjectId,
        ref: "appointment",
        required: true
    },
    message: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['Active', 'Completed', 'Cancelled','Send To Admin'],
        default: 'Active',
        required: true
    }
}, {
    timestamps: true
});

const Ticket = mongoose.model('ticket', ticketSchema);
Ticket.createIndexes();

module.exports = Ticket;