const connectToMongo = require('./db'); 
const express = require('express');
var cors = require('cors')
// require('dotenv').config();

connectToMongo();
const app = express()
 
app.use(cors())
const port = 3100

app.use(express.json());   // middleware for use of request body - If you want to use request body then you have to include it.


// Admin Auth Routes
app.use("/auth/user/", require("./routes/user/user")); 

// Common Page Routes
app.use('/api/employee/', require('./routes/employee/employee')); 
app.use('/api/service/', require('./routes/service/service'));
app.use('/api/category/', require('./routes/service/category'));


// Web API Routes
app.use('/web-api/category/', require('./routes/website/category'));
app.use('/web-api/service/', require('./routes/website/service'));
app.use('/web-api/service-provider/', require('./routes/website/serviceProvider'));  
app.use('/web-api/appointment/', require('./routes/website/appointment')); 
app.use('/web-api/ticket/', require('./routes/website/ticket')); 
app.use('/web-api/review/', require('./routes/website/review')); 

app.use('/chat/', require('./routes/website/message')); 


app.listen(port, () => {
    console.log(`App listening on port http://localhost:${port}`)
})