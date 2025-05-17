const fs = require("fs");
const cloudinary = require("cloudinary");
const Blog = require("../models/BlogModel.js");
const Tag = require("../models/TagModel.js");
const { cloudinaryUpload } = require("../utils/cloudinaryUpload.js");


const createBlog = async (req, res) => {
  try {
    const { title, description, tag, authorName } = req.body;

    console.log(req.body)

    let slug;
    let isUnique = false;

    while (!isUnique) {
      const timestamp = Date.now();
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      slug = `${title
        .toLowerCase()
        .replace(/[?&=]/g, "")
        .replace(/\s+/g, "-")}-${timestamp}-${randomNum}`;

      const existingBlog = await Blog.findOne({ slug });
      if (!existingBlog) {
        isUnique = true;
      }
    }

    const sanitizedTitle = title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[?&=]/g, "");

    // Upload main image (if you're still keeping this)

    // console.log(req.files);
    const { mainImage, subImages } = req.files;
    let imgUrl = {};
    if (mainImage) {
      imgUrl = await cloudinaryUpload(mainImage[0].path, sanitizedTitle, "blogs");
      if (imgUrl === "file upload failed") {
        fs.unlinkSync(mainImage[0].path);
        return res.status(400).json({ 
          statusCode: 400, 
          message: "file upload failed", 
          data: null 
        });
      }
    }

    const subImageUrls = [];
    if (subImages && subImages.length > 0) {
      for (let i = 0; i < subImages.length; i++) {
        const file = subImages[i];
        const subImgUrl = await cloudinaryUpload(file.path, `${sanitizedTitle}-sub-${i}`, "blogs");
        if (subImgUrl !== "file upload failed") {
          subImageUrls.push(subImgUrl.url);
        }
      }
    }


    const blog = await Blog.create({
      title,
      description,
      tag,
      authorName,
      slug,
      image: imgUrl.url || null,
      subImages: subImageUrls
    });

    res.status(201).json({ 
      statusCode: 201, 
      message: "new blog created", 
      data: blog 
    });
  } catch (error) {
    // Clean up any remaining files if error occurs
    if (req.files) {
      const files = [].concat(req.files.mainImage || [], req.files.subImages || []);
      files.forEach(file => {
        if (fs.existsSync(file.path)) {
          try {
            fs.unlinkSync(file.path);
          } catch (err) {
            console.log(err);
          }
        }
      });
    }
    res.status(500).json({
      statusCode: 500,
      message: "internal server error",
      data: error.message,
    });
  }
};




const getAllBlogs = async (req, res) => {
  try {
    let { page, limit, tag, search } = req.query;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 15;
    const skip = (page - 1) * limit;

    let filter = {};

    if (tag) {
      const tagFound = await Tag.findOne({ title: tag });
      if (!tagFound) {
        res
          .status(404)
          .json({ statusCode: 404, message: "Tag not found", data: null });
      }
      filter.tag = tagFound._id;
    }

    if (search) {
      filter.title = { $regex: search, $options: "i" };
    }

    const totalBlogs = await Blog.countDocuments(filter);

    const blogs = await Blog.find(filter)
      .populate("tag", "-createdAt -updatedAt -__v", null, { strictPopulate: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      statusCode: 200,
      message: "fetched all blogs successfully",
      data: blogs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalBlogs / limit),
        totalBlogs,
        hasNextPage: page * limit < totalBlogs,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      message: "internal server error",
      data: error.message,
    });
  }
};


const getSingleBlog = async (req, res) => {
  try {
    const { slug } = req.params;

    console.log(slug);

    const blog = await Blog.findOne({ slug })
      .populate({ path: "tag", select: "-createdAt -updatedAt -__v", populate: { path: "title", select: "title" } })
      .select("-__v");

    if (!blog) {
      res
        .status(404)
        .json({ statusCode: 404, message: "blog not found", data: null });
    }

    blog.views += 1;
    await blog.save();

    res
      .status(200)
      .json({
        statusCode: 200,
        message: "fetch blog successfully",
        data: blog,
      });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      message: "internal server error",
      data: error.message,
    });
  }
};




const updateBlog = async (req, res) => {
  try {
    const { slug } = req.params;
    const { title, description, tag, authorName, existingSubImages } = req.body;
 
    const blog = await Blog.findOne({ slug });
    if (!blog) {
      return res.status(404).json({
        statusCode: 404,
        message: "Blog not found",
        data: null,
      });
    }
 
    const updateData = {
      title: title || blog.title,
      description: description || blog.description,
      authorName: authorName || blog.authorName,
    };
 
    if (tag) updateData.tag = tag;
 
    if (req.files && req.files.mainImage && req.files.mainImage[0]) {
      if (blog.image) {
        try {
          const oldImageUrl = blog.image;
          const parts = oldImageUrl.split("/");
          const filenameWithExt = parts.pop();
          const folder = parts.pop();
          const oldPublicId = `${folder}/${filenameWithExt.split(".")[0]}`;
          await cloudinary.uploader.destroy(oldPublicId);
        } catch (err) {
          console.log("Failed to delete main image from Cloudinary:", err);
        }
      }
 
      const sanitizedTitle = (title || blog.title).toLowerCase().replace(/\s+/g, "-").replace(/[?&=]/g, "");
      const imgUrl = await cloudinaryUpload(req.files.mainImage[0].path, sanitizedTitle, "blogs");
 
      if (imgUrl?.url) {
        updateData.image = imgUrl.url;
      }
 
      if (fs.existsSync(req.files.mainImage[0].path)) {
        fs.unlinkSync(req.files.mainImage[0].path);
      }
    }
 
    let finalSubImages = [];
 
    if (existingSubImages) {
      if (Array.isArray(existingSubImages)) {
        finalSubImages = [...existingSubImages];
      } else {
        finalSubImages = [existingSubImages];
      }
    } else if (blog.subImages) {
      finalSubImages = [...blog.subImages];
    }
 
    if (req.files && req.files.subImages) {
      const subImages = Array.isArray(req.files.subImages) ? req.files.subImages : [req.files.subImages];
 
      for (const subImage of subImages) {
        const sanitizedTitle = (title || blog.title).toLowerCase().replace(/\s+/g, "-").replace(/[?&=]/g, "");
        const uploadResult = await cloudinaryUpload(subImage.path, `${sanitizedTitle}-sub-${Date.now()}`, "blogs");
 
        if (uploadResult?.url) {
          finalSubImages.push(uploadResult.url);
        }
 
        if (fs.existsSync(subImage.path)) {
          fs.unlinkSync(subImage.path);
        }
      }
    }
 
    updateData.subImages = finalSubImages;
 
    const updatedBlog = await Blog.findOneAndUpdate({ slug }, updateData, { new: true });
 
    return res.status(200).json({
      statusCode: 200,
      message: "Blog updated successfully",
      data: updatedBlog,
    });
  } catch (error) {
    console.log("Update blog error:", error);
    res.status(500).json({
      statusCode: 500,
      message: "Internal server error",
      data: error.message,
    });
  }
};
 
 



// const updateBlog = async (req, res) => {
//   try {
//     const { slug } = req.params;
//     const { title, description, tag, authorName, referenceUrl } = req.body;

//     const blog = await Blog.findOne({ slug });
//     if (!blog) {
//       return res.status(404).json({
//         statusCode: 404,
//         message: "blog not found",
//         data: null,
//       });
//     }

//     const updateData = {
//       title: title || blog.title,
//       description: description || blog.description,
//       tag: tag || blog.tag,
//       authorName: authorName || blog.authorName,
//       referenceUrl: blog.referenceUrl,
//       subImages: blog.subImages,
//       image: blog.image,
//     };

//     console.log(updateData);

//     // Update referenceUrl if it’s changed
//     if (referenceUrl) {
//       const newUrls = referenceUrl.split(",").map((url) => url.trim());
//       const uniqueUrls = [...new Set(newUrls)];

//       const currentUrls = blog.referenceUrl || [];
//       const urlsChanged = uniqueUrls.length !== currentUrls.length ||
//         !uniqueUrls.every((url) => currentUrls.includes(url));

//       if (urlsChanged) {
//         updateData.referenceUrl = uniqueUrls;
//       }
//     }

//     // Handle subImages upload
//     if (req.files && req.files.subImages) {
//       const subImages = [].concat(req.files.subImages);
//       const subImageUrls = [];

//       for (const subImage of subImages) {
//         const sanitizedTitle = (title || blog.title)
//           .toLowerCase()
//           .replace(/\s+/g, "-")
//           .replace(/[?&=]/g, "");

//         const subImageUrl = await cloudinaryUpload(
//           subImage.path,
//           `${sanitizedTitle}-sub`,
//           "blogs"
//         );

//         if (subImageUrl?.url) {
//           subImageUrls.push(subImageUrl.url);
//         }
//       }

//       if (subImageUrls.length > 0) {
//         updateData.subImages = subImageUrls;
//       }
//     }

//     // Handle main image update
//     if (req.file) {
//       const sanitizedTitle = (title || blog.title)
//         .toLowerCase()
//         .replace(/\s+/g, "-")
//         .replace(/[?&=]/g, "");

//       if (blog.image) {
//         try {
//           const oldImageUrl = blog.image;
//           const parts = oldImageUrl.split("/");
//           const filenameWithExt = parts.pop();
//           const folder = parts.pop();
//           const oldPublicId = `${folder}/${filenameWithExt.split(".")[0]}`;
//           await cloudinary.uploader.destroy(oldPublicId);
//         } catch (err) {
//           console.log("Old image deletion failed:", err);
//         }
//       }

//       const imgUrl = await cloudinaryUpload(req.file.path, sanitizedTitle, "blogs");

//       if (imgUrl?.url) {
//         updateData.image = imgUrl.url;
//       } else {
//         return res.status(500).json({
//           statusCode: 500,
//           message: "failed to upload main image",
//           data: null,
//         });
//       }
//     }

//     const updatedBlog = await Blog.findOneAndUpdate({ slug }, updateData, {
//       new: true,
//     });

//     return res.status(200).json({
//       statusCode: 200,
//       message: "blog updated successfully",
//       data: updatedBlog,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       statusCode: 500,
//       message: "internal server error",
//       data: error.message,
//     });
//   }
// };



const getLatestBlogs = async (req, res) => {
  try {
    const currentDate = new Date();

    const last7DaysDate = new Date();
    last7DaysDate.setDate(currentDate.getDate() - 7);
    last7DaysDate.setUTCHours(0, 0, 0, 0);


    const blogs = await Blog.find({
      createdAt: { $gte: last7DaysDate },
    })
      .sort({ views: -1 })
      .limit(6);

    res.status(200).json({
      statusCode: 200,
      message: "fetched blogs from the last 7 days successfully",
      data: blogs,
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      message: "internal server error",
      data: error.message,
    });
  }
};


const deleteBlog = async (req, res) => {
  try {
    const { slug } = req.params;

    const blog = await Blog.findOne({ slug });
    if (!blog) {
      res
        .status(404)
        .json({ statusCode: 404, message: "blog not found", data: null });
    }


    await Blog.deleteOne({ slug });

    return res.status(200).json({
      statusCode: 200,
      message: "blog deleted successfully",
      data: null,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      statusCode: 500,
      message: "internal server error",
      data: "blog.remove is not a function",
    });
  }
};



module.exports = {
  createBlog,
  getAllBlogs,
  getSingleBlog,
  updateBlog,
  getLatestBlogs,
  deleteBlog,
};

