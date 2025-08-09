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
router.get(
  "/pendaftaran/:calonMahasiswaId/mhs-id",
  pendaftaranController.getPendaftaranByCalonMahasiswaId
);

router.put(
  "/pendaftaran/:pendaftaranId",
  pendaftaranController.updatePendaftaran
);

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

router.post(
  "/pendaftaran/:pendaftaranId/beasiswa",
  pendaftaranController.submitAplikasiBeasiswa
);

router.get(
  "/beasiswa/aplikasi",
  // authenticateToken, requireAdmin,
  pendaftaranController.getAllAplikasiBeasiswa
);

// Mengubah status satu aplikasi beasiswa
router.put(
  "/beasiswa/aplikasi/:aplikasiId/status",
  pendaftaranController.updateStatusBeasiswa
);
export default router;
