const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const errorHandler = require("./utils/errorHandler");

dotenv.config();
connectDB();

const app = express();
app.use("/api/stripe", require("./routes/paymentRoutes"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());


// root check route
app.get("/", (req, res) => {
    return res
      .status(200)
      .json({ status: true, message: "welcome to blog application" });
  });

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));
app.use("/api/newsletter", require("./routes/newsLetterRoutes"));
app.use("/api/consultation", require("./routes/consultation"));
app.use("/api/contact", require("./routes/contactRoutes"));
app.use("/api/tags", require("./routes/tagRoutes"));
app.use("/api/blogs",require("./routes/blogRoutes"));
app.use("/api/notification", require("./routes/notificationRoutes"));
app.use("/api/emissions", require("./routes/emissionsRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));

app.use(errorHandler); 

module.exports = app;
