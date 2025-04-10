const mongoose = require('mongoose');
const { Schema } = mongoose;

const categorySchema = new Schema({
    name: {
        type: String,
        required: true,
        trim:true
    },
    description: {
        type: String,
        required: true,
        trim:true
    }
}, {
    timestamps: true // ✅ This enables createdAt and updatedAt automatically
});

const category = mongoose.model('category', categorySchema);
category.createIndexes();
module.exports = category
