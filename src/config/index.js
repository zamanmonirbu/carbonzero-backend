const dotenv=require("dotenv");
dotenv.config();

const serverPort = process.env.PORT || 5000;
const dbUrl = process.env.MONGO_URI;

const tokenSecret = process.env.JWT_SECRET;
const tokenExpires = process.env.JWT_EXPIRES;
const salt= process.env.SALT_ROUNDS;

const emailExpires= process.env.EMAIL_EXPIRES;
const emailAddress = process.env.EMAIL_ADDRESS;
const emailPass = process.env.EMAIL_SECRET;
const emailPort = process.env.EMAIL_PORT;
const emailHost = process.env.EMAIL_HOST;
const emailFrom = process.env.EMAIL_FROM;
const emailTo = process.env.EMAIL_TO;

const adminMail=process.env.ADMIN_EMAIL;

const rateLimitWindow = process.env.RATE_LIMIT_WINDOW 
const rateLimitMax = process.env.RATE_LIMIT_MAX 
const rateLimitDelay =process.env.RATE_LIMIT_DELAY


const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME;
const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY;
const cloudinarySecret = process.env.CLOUDINARY_API_SECRET;

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const frontendUrl=process.env.FRONTEND_URL;

const accessTokenSecrete= process.env.ACCESS_TOKEN_SECRET;
const refreshTokenSecrete= process.env.REFRESH_TOKEN_SECRET;
const accessTokenExpires= process.env.ACCESS_TOKEN_EXPIRES;
const refreshTokenExpires= process.env.REFRESH_TOKEN_EXPIRES;



const standardPriceId=process.env.ADVANCE_PRICE_ID;
const premiumPriceId=process.env.UNLIMITED_PRICE_ID;



module.exports= {
  serverPort,
  dbUrl,
  tokenSecret,
  tokenExpires,
  salt,
  refreshTokenExpires,
  accessTokenExpires,
  accessTokenSecrete,
  refreshTokenSecrete,
  emailAddress,
  emailPass,
  emailHost,
  emailTo,
  emailPort,
  emailExpires,
  emailFrom,
  adminMail,
  rateLimitWindow,
  rateLimitMax,
  rateLimitDelay,
  cloudinaryCloudName,
  cloudinaryApiKey,
  cloudinarySecret,
  stripeSecretKey,
  frontendUrl,
  stripeWebhookSecret,
  standardPriceId,
  premiumPriceId,
  
};



