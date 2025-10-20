import multer from 'multer';
import cloudinary from '../../config/cloudinary.js';
import { Readable } from 'stream';

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, 
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas!'), false);
    }
  },
});

const uploadToCloudinary = (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const stream = cloudinary.uploader.upload_stream(
    (error, result) => {
      if (error) {
        return next(error);
      }
      req.file.cloudinaryUrl = result.secure_url;
      next();
    }
  );

  const readableStream = new Readable();
  readableStream.push(req.file.buffer);
  readableStream.push(null);
  readableStream.pipe(stream);
};

export { upload, uploadToCloudinary };