const mongoose = require("mongoose")

mongoose.connect("mongodb://localhost:27017/Login-tut")

  .then(() => {
    console.log("mongodb connected");
  })
  .catch((error) => {
    console.log("Failed to connect:", error);
  });

const LogInSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  }
})

const collection = mongoose.model("users", LogInSchema);

module.exports = collection;