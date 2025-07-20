import express from "express";
import * as pendaftaranController from "../http/pendaftaranController.js";
import {
  ftpUploadMiddleware,
  uploadSingleFile,
} from "../http/middlewares/fileUpload.js";

const router = express.Router();

router.post("/pendaftaran", pendaftaranController.createInitialPendaftaran);
router.get("/pendaftaran", pendaftaranController.getAllPendaftaran);

router.get(
  "/pendaftaran/:pendaftaranId",
  pendaftaranController.getPendaftaranById
);

router.put("/:pendaftaranId", pendaftaranController.updatePendaftaran);

router.delete(
  "/pendaftaran/:pendaftaranId",
  pendaftaranController.deletePendaftaran
);

router.get(
  "/verifyPendaftaran/:pendaftaranId",
  pendaftaranController.verifyPendaftaran
);

//Route for dokumen management
router.post(
  "/pendaftaran/:pendaftaranId/dokumen",
  uploadSingleFile, // Middleware multer untuk satu file
  ftpUploadMiddleware,
  pendaftaranController.addDokumen
);
router.delete(
  "/pendaftaran/:dokumenId/dokumen",
  pendaftaranController.deleteDokumen
);

export default router;
