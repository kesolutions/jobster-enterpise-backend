const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/Login-tut", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  bufferTimeoutMS: 30000,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  poolSize: 20,
}).then(() => {
  console.log("Connected to MongoDB");
}).catch((error) => {
  console.error("MongoDB connection error:", error);
});

module.exports = mongoose;
