const mongoose = require('mongoose');
const { Schema } = mongoose;

const employeeSchema = new Schema({
    first_name: {
        type: String,
        required: true
    },
    last_name: {
        type: String,
        required: true
    },
    age: {
        type: String,
        required: true
    },
    date_of_join: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    department: {
        type: String,
        required: true
    },
    employee_type: {
        type: String,
        required: true
    },
    current_status: {
        type: Number,
        required: false
    },
    date: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true // ✅ This enables createdAt and updatedAt automatically
});
const employee = mongoose.model('employee', employeeSchema);
employee.createIndexes();
module.exports = employee