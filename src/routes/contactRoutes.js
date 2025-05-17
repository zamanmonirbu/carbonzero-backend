const {
  deleteContact,
  getAllContacts,
  getContactById,
  sendContactMessage,
} = require("../controllers/contactUsController.js");

const { Router } = require("express");
const { adminAuthMiddleware } = require("../middlewares/authMiddleware.js");
const router = Router();

router.get("/",adminAuthMiddleware, getAllContacts);
router.get("/:id",adminAuthMiddleware, getContactById);
router.post("/", sendContactMessage);
router.delete("/:id",adminAuthMiddleware, deleteContact);

module.exports = router;

