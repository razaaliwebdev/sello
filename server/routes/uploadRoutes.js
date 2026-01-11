import express from "express";
import { uploadFile } from "../controllers/uploadController.js";
import { upload } from "../middlewares/multer.js";
import { auth } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Middleware to handle both 'file' and 'image' field names
const uploadEither = (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (!err && !req.file) {
      upload.single("file")(req, res, next);
    } else {
      next(err);
    }
  });
};

// Protected route - any authenticated user can upload (or restrict to admin if needed)
router.post("/", auth, uploadEither, uploadFile);

export default router;
