const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    category: {
        type: mongoose.Types.ObjectId,
        ref: "category",
        required: false,
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        type: String,
        required: false,
        trim: true
    },
    city: {
        type: String,
        required: false,
        trim: true
    },
    password: {
        type: String,
        required: true,
        trim: true
    },
    profilePicture: {
        type: String,
        required: false
    },
    role: {
        type: String,
        required: true,
        trim: true
    },
    availability: {
        type: String,
        required: false,
        trim: true
    },
    experience: {
        type: String,
        required: false,
        trim: true
    },
    skills: {
        type: String,
        required: false,
        trim: true
    },
    pricing: {
        type: String,
        required: false,
        trim: true
    },
    identityProof: {
        type: String,
        required: false
    },
    status: {
        type: String,
        default: 'Active',
        required: true
    }
}, {
    timestamps: true // ✅ This enables createdAt and updatedAt automatically
});

const user = mongoose.model('user', userSchema);
user.createIndexes();
module.exports = user;
