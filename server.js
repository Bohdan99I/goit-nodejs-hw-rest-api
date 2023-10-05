const mongoose = require("mongoose");

const app = require("./app");

const DB_HOST  = "mongodb+srv://Bohdan99:tQ9zlGSPIb2geAXk@cluster0.jy2adfh.mongodb.net/db-contacts?retryWrites=true&w=majority&appName=AtlasApp";

mongoose.set("strictQuery", true);

mongoose
  .connect(DB_HOST)
  .then(() => {
    app.listen(3000);
    console.log("Database connection successful");
  })
  .catch((error) => {
    console.log(error.message);
    process.exit(1);
  });
