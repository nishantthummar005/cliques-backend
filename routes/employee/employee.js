const express = require('express');
const router = express.Router();
const Employee = require('../../models/employee/employee');
const { body, validationResult } = require('express-validator');

// Add employee Controller
router.post('/add', [
    body('first_name').notEmpty(),
    body('last_name').notEmpty(),
    body('age').notEmpty(),
    body('date_of_join').notEmpty(),
    body('title').notEmpty(),
    body('department').notEmpty(),
    body('employee_type').notEmpty()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, error: errors.array() });
    }
    try {
        Employee.create({
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            age: req.body.age,
            date_of_join: req.body.date_of_join,
            title: req.body.title,
            department: req.body.department,
            employee_type: req.body.employee_type,
            current_status: 1
        }).then(
            res.status(200).send({ success: true, message: "Yeah, employee added successfully." })
        ).catch(
            err => console.log(err.message)
        );
    } catch (error) {
        res.status(500).send({ success: false, error: "Oops, some error occured!" });
    }
});

// Get All Employee Data Controller
router.get('/show', async (req, res) => {
    try {
        const employeeData = await Employee.find();
        res.send(employeeData);
    } catch (error) {
        console.error(error.message);
        res.status(500).send({ error: "Oops, some error occured while fetching contacts!" });
    }
});

module.exports = router
