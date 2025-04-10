const mongoose = require('mongoose');
const mongoCloudUri = process.env.MONGO_URI;

const connectToMongo = () => {
    mongoose.connect(mongoCloudUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }, () => {
        console.log("Connected to mongoDB successfully.");
    });
};

module.exports = connectToMongo;
