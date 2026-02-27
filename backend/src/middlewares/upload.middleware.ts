import multer, { type FileFilterCallback } from "multer";
import type { Request } from "express";

const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedMimes = [
      "image/jpeg", "image/png", "image/jpg", "image/webp",
      "application/pdf",
      "video/mp4", "video/mpeg", "video/quicktime",
      // Docs
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      // PPT
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      // Archives
      "application/zip",
      "application/x-zip-compressed",
      "application/x-zip"
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("File type not supported. Only images, PDFs and videos are allowed."));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // Increase to 50MB for videos
});

export { upload };
export default upload;
