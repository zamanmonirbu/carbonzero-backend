const {
  createBlog,
  deleteBlog,
  getAllBlogs,
  getLatestBlogs,
  getSingleBlog,
  updateBlog,
} = require("../controllers/blogController.js");
const { multerUpload } = require("../middlewares/multer.js");

const { adminAuthMiddleware,publicPrivateMiddleware, adminAndSuperAdmin } = require("../middlewares/authMiddleware");

const { Router } = require("express");

const router = Router();


router.post(
  "/",
  adminAndSuperAdmin,
  multerUpload([
    { name: "mainImage", maxCount: 1 },
    { name: "subImages", maxCount: 10 },
  ]),
  createBlog
);


router.get("/",publicPrivateMiddleware, getAllBlogs);

router.get("/latest",publicPrivateMiddleware, getLatestBlogs);

router.get("/:slug",publicPrivateMiddleware, getSingleBlog);

router.put("/:slug",adminAuthMiddleware, multerUpload([
  { name: "mainImage", maxCount: 1 },
  { name: "subImages", maxCount: 10 },
]), updateBlog);

router.delete("/:slug",adminAuthMiddleware, deleteBlog);

module.exports = router;

