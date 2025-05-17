const sendEmail = require("../utils/sendEmail");
const consultationMessageTemplate = require("../utils/ConsultationMessage");
const { adminMail } = require("../config");
const User = require("../models/User");
const Consultation = require("../models/Consultation");

const bookConsultation = async (req, res) => {
  const {
    name,
    email:getmail,
    phone_number,
    business_nature,
    biggest_challenge,
    best_time_to_call,
    bookingType,
  } = req.body;

  const {email}=req.user;


  console.log(req.body)

  try {
    const consultation = new Consultation({
      name,
      email,
      phone_number,
      business_nature,
      biggest_challenge,
      best_time_to_call,
      bookingType,
    });
    
    const savedConsultation = await consultation.save();

    if (savedConsultation.bookingType === "free") {
      const data = {
        name,
        getmail,
        phone_number,
        business_nature,
        biggest_challenge,
        best_time_to_call,
        bookingType,
      };

      const htmlMessage = consultationMessageTemplate(data);


      const emailResponse = await sendEmail({
        to: adminMail,
        subject: `Consultation Booking from ${data.name}`,
        html: htmlMessage,
      });
    
        res
          .status(200)
          .json({
            message: "Consultation booked successfully and email sent.",
          });
      }
      else{

        console.log(email)
        
        await User.findOneAndUpdate(
          { email },
          { videoConsultation: true }
        );
        res.status(200).json({ message: "Please paid and comfirm your booking."});
      }

      


  } catch (error) {
    console.error("Booking error:", error);
    res
      .status(500)
      .json({
        message: "An error occurred while booking consultation.",
        error: error.message,
      });
  }
};

module.exports = { bookConsultation };
