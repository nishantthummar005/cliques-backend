const mongoose = require('mongoose');
const { Schema } = mongoose;

const appointmentSchema = new Schema({
    client: {
        type: Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    serviceProvider: {
        type: Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true // optional: normalize email
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    appointment_datetime: {
        type: Date,
        required: true
    }, 
    fees: {
        type: Number,
        required: true,
        min: 0
    },
    card_name: {
        type: String,
        trim: true
    },
    card_number: {
        type: String,
        trim: true
        // Consider masking or encrypting if you're storing this
    },
    card_expiry: {
        type: String,
        trim: true
    },
    card_cvv: {
        type: String
        // No trim needed; consider encrypting or removing
    },
    status: {
        type: String,
        enum: ['Active', 'Completed', 'Cancelled'],
        default: 'Active',
        required: true
    }
}, {
    timestamps: true
});

const Appointment = mongoose.model('appointment', appointmentSchema);
Appointment.createIndexes();

module.exports = Appointment;