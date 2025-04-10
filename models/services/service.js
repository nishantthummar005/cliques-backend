const mongoose = require('mongoose');
const { Schema } = mongoose;

const serviceSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: mongoose.Types.ObjectId,
        ref: "category",
        required: true,
    },
    price: {
        type: Number,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    duties: {
        type: String,
        required: true,
        trim: true
    },
    availability: {
        type: String,
        required: true,
        trim: true
    },
    images: {
        type: Array,
        required: false
    }
}, {
    timestamps: true // ✅ This enables createdAt and updatedAt automatically
});
const service = mongoose.model('service', serviceSchema);
service.createIndexes();
module.exports = service