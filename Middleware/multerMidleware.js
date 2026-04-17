import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./images");
    },

    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);

        // Get product type from request, default to 'appointment' if it's an appointment route
        const isAppointment = req.originalUrl && req.originalUrl.includes('appointments');
        const defaultType = isAppointment ? "appointment" : "product";
        const productType = (req.body && req.body.type) || defaultType;

        const fileName = `${productType}_${Date.now()}${ext}`;

        cb(null, fileName);
    }
});

export const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});