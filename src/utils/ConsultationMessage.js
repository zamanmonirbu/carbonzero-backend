const consultationMessageTemplate = (data) => {
  return `
    <div style="max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #f9f9f9;">
      <h2 style="color: #333; text-align: center;">New Consultation Booking</h2>
      <p style="font-size: 16px; color: #555;"><strong>Name:</strong> ${data.name}</p>
      <p style="font-size: 16px; color: #555;"><strong>Email:</strong> ${data.email}</p>
      <p style="font-size: 16px; color: #555;"><strong>Phone Number:</strong> ${data.phone_number}</p>
      <p style="font-size: 16px; color: #555;"><strong>Business Nature:</strong> ${data.business_nature}</p>
      <p style="font-size: 16px; color: #555;"><strong>Biggest Challenge:</strong> ${data.biggest_challenge}</p>
      <p style="font-size: 16px; color: #555;"><strong>Best Time to Call:</strong> ${data.best_time_to_call}</p>
      <p style="font-size: 16px; color: #555;"><strong>Booking Type:</strong> ${data.bookingType}</p>
    </div>
  `;
};

module.exports = consultationMessageTemplate;

