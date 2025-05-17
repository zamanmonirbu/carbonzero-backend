const {
  createTag,
  deleteTag,
  getAllTags,
  getSpecificTag,
  updateTag,
} = require("../controllers/tagController.js");

const { Router } = require("express");
const { adminAuthMiddleware, publicPrivateMiddleware } = require("../middlewares/authMiddleware.js");

const router = Router();

router.post("/", adminAuthMiddleware, createTag);
router.get("/", publicPrivateMiddleware, getAllTags);
router.put("/:slug", adminAuthMiddleware, updateTag);
router.get("/:slug", getSpecificTag);
router.delete("/:slug", adminAuthMiddleware, deleteTag);

module.exports = router;

