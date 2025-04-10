const mongoose = require('mongoose');
const { Schema } = mongoose;

const reviewSchema = new Schema({
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
    serviceProvider: {
        type: Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    rating: {
        type: Number,
        trim: true
    },
    review: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Inactive',
        required: true
    }
}, {
    timestamps: true
});

const Review = mongoose.model('review', reviewSchema);
Review.createIndexes();

module.exports = Review;