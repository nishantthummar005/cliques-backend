const jwt = require('jsonwebtoken');
const JWT_SIGN = "commonAdmin";   // change as per your choice

const userdata = (req, res, next) => {
    // get the admin from the JWT token and add td to req object
    const token = req.header('auth-token');  // get header data
    if (!token) {
        res.status(401).send({ error: "Sorry, provide valid authentication token!" });
    }
    try {
        const data = jwt.verify(token, JWT_SIGN);
        req.admin = data.admin;
        next();
    } catch (error) {
        console.error(error.message); 
        res.status(500).send({ error: "Sorry, provide valid authentication token!" });
    }
}

module.exports = userdata