const router = require("express").Router();
const { getAllSubscribedUsers, joinNewsletter, sendNewsLetter } = require("../controllers/newsLetterController");
const { adminAndSuperAdmin } = require("../middlewares/authMiddleware");


router.get("/",adminAndSuperAdmin, getAllSubscribedUsers);
router.post("/", joinNewsletter);
router.post("/send",adminAndSuperAdmin, sendNewsLetter);

module.exports = router;

