const express = require("express");
const bodyParser = require('body-parser');
const path = require("path");
const multer = require("multer");
const mongoose  = require("mongoose");
const app = express();
const cors = require("cors");
const { MONGO_URL } = require('./config/environment');
const router = require("./routes/router");

//MongoDb connection
mongoose.connect(MONGO_URL, {socketTimeoutMS: 1000}).then(()=>{console.log("MongoDB is connected")})
 .catch((err)=>{console.error(err)});


//uploader config
const storage = multer.diskStorage({
  destination: '../public',
  filename(_, file, cb) {
    cb(null, "google-form-content-questions-" + Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });


//middleware
app.use(express.static('../public'))
app.use(cors());
app.use(bodyParser.json({limit : '50mb',extended : true}));
app.use(bodyParser.urlencoded({limit: '50mb',extended : true}));
app.use(express.json());

//Health check route
app.get("/", (_, res)=> {
  return res.json({message: "application is running"})
});

//Api routes
app.use('/api', router);

module.exports = { app };