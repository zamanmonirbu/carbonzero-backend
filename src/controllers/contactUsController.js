const ContactUs = require("../models/ContactUsModel.js");
const NewsLetter = require("../models/NewsLetter.js");

// @desc:  send message using contact us form
// @route: POST /api/v1/contact

  const sendContactMessage = async (req, res) => {
    try {
      const { email } = req.body;
  
      const existing = await NewsLetter.findOne({ email });
      if (existing) {
        return res.status(400).json({
          statusCode: 400,
          message: "Welcome for submitting data",
          data: null,
        });
      }
  
      const newSubscriber = await NewsLetter.create({ email });
  
      return res.status(200).json({
        statusCode: 200,
        message: "Welcome for submitting data",
        data: newSubscriber,
      });
    } catch (error) {
      return res.status(500).json({
        statusCode: 500,
        message: "Internal server error",
        data: error.message,
      });
    }
  };
  


// @desc:  get all contact
// @route: GET /api/v1/contact
const getAllContacts = async (req, res) => {
  try {
    const contacts = await ContactUs.find({});
    return res.status(200).json({
      statusCode: 200,
      message: "all contacts fetched successfully",
      data: contacts,
    });
  } catch (error) {
    return res.status(500).json({
      statusCode: 500,
      message: "internal server error",
      data: error.message,
    });
  }
};

// @desc:  get a single contact
// @route: GET /api/v1/contact/:id
const getContactById = async (req, res) => {
  try {
    const contact = await ContactUs.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({
        statusCode: 404,
        message: "contact not found",
        data: null,
      });
    }

    return res.status(200).json({
      statusCode: 200,
      message: "contact fetched successfully",
      data: contact,
    });
  } catch (error) {
    return res.status(500).json({
      statusCode: 500,
      message: "internal server error",
      data: error.message,
    });
  }
};

// @desc:  delete contact form the db
// @route: DELETE /api/v1/contact/:id
const deleteContact = async (req, res) => {
  try {
    const deletedContact = await ContactUs.findByIdAndDelete(req.params.id);
    if (!deletedContact) {
      return res.status(404).json({
        statusCode: 404,
        message: "contact not found",
        data: null,
      });
    }

    return res.status(200).json({
      statusCode: 200,
      message: "contact deleted successfully",
      data: deletedContact,
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
  sendContactMessage,
  getAllContacts,
  getContactById,
  deleteContact,
};

