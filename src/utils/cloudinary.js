import { v2 as cloudinary } from 'cloudinary';

// Config is deferred so that dotenv has already populated process.env
// by the time the first upload request arrives (ES module import hoisting
// means this file is evaluated before dotenv.config() runs in server.js).
export function configureCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export default cloudinary;
