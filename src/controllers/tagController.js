const Tag = require("../models/TagModel.js");

// @desc:  create tag
// @route: POST /api/v1/tags/
const createTag = async (req, res) => {
  try {
    const { title } = req.body;
    const randomSlug = `${title}-${
      Date.now() - Math.round(Math.random() * 900000 + 1)
    }`;

    const tagFound = await Tag.findOne({ title });
    if (tagFound) {
      return res.status(400).json({
        statusCode: 400,
        message: "Tags already exist",
        data: null,
      });
    }

    const tag = await Tag.create({ title, slug: randomSlug });

    return res.status(201).json({
      statusCode: 201,
      message: "Tag created successfully",
      data: tag,
    });
  } catch (error) {
    return res.status(500).json({
      statusCode: 500,
      message: "internal server error",
      data: error.message,
    });
  }
};

// @desc:  update tag
// @route: PUT /api/v1/tags/
const updateTag = async (req, res) => {
  try {
    const { slug } = req.params;
    const { title } = req.body;

    const tagFound = await Tag.findOne({ slug });
    if (!tagFound) {
      return res.status(400).json({
        statusCode: 400,
        message: "Tag not found",
        data: null,
      });
    }

    const tag = await Tag.findOneAndUpdate(
      { slug },
      {
        title: title || tagFound.title,
      },
      { new: true }
    );

    return res.status(200).json({
      statusCode: 200,
      message: "Tag updated successfully",
      data: tag,
    });
  } catch (error) {
    return res.status(500).json({
      statusCode: 500,
      message: "internal server error",
      data: error.message,
    });
  }
};

// @desc:  get all tags
// @route: GET /api/v1/tags/
const getAllTags = async (req, res) => {
  try {
    const tags = await Tag.find({});
    return res.status(200).json({
      statusCode: 200,
      message: "fetch all tag successfully",
      data: tags,
    });
  } catch (error) {
    return res.status(500).json({
      statusCode: 500,
      message: "internal server error",
      data: error.message,
    });
  }
};

// @desc:  get specific tag
// @route: GET /api/v1/tags/:slug
const getSpecificTag = async (req, res) => {
  try {
    const { slug } = req.params;
    const tag = await Tag.findOne({ slug });

    if (!tag) {
      return res.status(400).json({
        statusCode: 400,
        message: "Tag not found",
        data: null,
      });
    }

    return res.status(200).json({
      statusCode: 200,
      message: "Tag fetch successfully",
      data: tag,
    });
  } catch (error) {
    return res.status(500).json({
      statusCode: 500,
      message: "internal server error",
      data: error.message,
    });
  }
};

// @desc:  delete specific tag
// @route: DELETE /api/v1/tags/:slug
const deleteTag = async (req, res) => {
  try {
    const { slug } = req.params;
    const tag = await Tag.findOne({ slug });

    if (!tag) {
      return res.status(400).json({
        statusCode: 400,
        message: "Tag not found",
        data: null,
      });
    }

    await Tag.findOneAndDelete(tag);

    return res.status(200).json({
      statusCode: 200,
      message: "Tag deleted successfully",
      data: null,
    });
  } catch (error) {
    return res.status(500).json({
      statusCode: 500,
      message: "internal server error",
      data: error.message,
    });
  }
};

module.exports = {
  createTag,
  updateTag,
  getAllTags,
  getSpecificTag,
  deleteTag,
};

