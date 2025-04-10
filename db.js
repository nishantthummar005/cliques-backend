const mongoose = require('mongoose');
const mongoCloudUri = "mongodb+srv://sauravchaudhary3355:qmmdOIn38McXTWaF@cliques-db.8uor3.mongodb.net/cliques"
const connectToMongo = () => {
    mongoose.connect(mongoCloudUri, () => {
        console.log("Connected to mongoDB successfully.")
    })
}
module.exports = connectToMongo
