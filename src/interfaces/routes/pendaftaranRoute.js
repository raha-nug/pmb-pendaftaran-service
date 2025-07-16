import express from "express";
import * as pendaftaranController from "../http/pendaftaranController.js";
import { ftpUploadMiddleware, uploadSingleFile,  } from "../http/middlewares/fileUpload.js";

const router = express.Router();

router.post("/add", pendaftaranController.createInitialPendaftaran);
router.get("/", pendaftaranController.getAllPendaftaran);

router.get("/:pendaftaranId", pendaftaranController.getPendaftaranById);

router.put("/:pendaftaranId/update", pendaftaranController.updatePendaftaran);

router.delete(
  "/:pendaftaranId/delete",
  pendaftaranController.deletePendaftaran
);


//Route for dokumen management
router.post(
  "/:pendaftaranId/dokumen",
  uploadSingleFile, // Middleware multer untuk satu file
  ftpUploadMiddleware,
  pendaftaranController.addDokumen
);
router.delete(
  "/:dokumenId/dokumen",
  pendaftaranController.deleteDokumen
);

export default router;
