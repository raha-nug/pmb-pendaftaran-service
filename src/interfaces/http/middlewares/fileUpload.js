import multer from "multer";
import path from "path";
import fs from "fs";
import { Client } from "basic-ftp";
import dotenv from "dotenv";
dotenv.config();

async function uploadToFTP(localPath, remoteFilename) {
  const client = new Client();
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      secure: false, // Set to true if using FTPS
    });

    await client.ensureDir(process.env.FTP_REMOTE_DIR);
    await client.uploadFrom(
      localPath,
      `${process.env.FTP_REMOTE_DIR}/${remoteFilename}`
    );
    client.close();
    return true;
  } catch (err) {
    console.error("FTP Upload Error:", err);
    return false;
  }
}


export async function deleteFromFTP(remotePath) {
  const client = new Client();
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      secure: false,
    });

    await client.remove(remotePath);
     client.close();
    return true;
  } catch (err) {
    console.error("FTP Delete Error:", err);
    return false;
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/png", "application/pdf"];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Tipe file tidak diizinkan. Hanya JPEG, PNG, dan PDF."),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5, // Max file size: 5 MB
  },
});

export const uploadSingleFile = upload.single("filePersyaratan");

export const ftpUploadMiddleware = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ message: "File tidak ditemukan" });
  }

  const localPath = req.file.path;
  const remoteFilename = req.file.filename;

  const success = await uploadToFTP(localPath, remoteFilename);

  fs.unlinkSync(localPath); // Hapus file lokal

  if (!success) {
    return res.status(500).json({ message: "Gagal upload ke FTP" });
  }

  req.uploadedFileUrl = `https://${process.env.FTP_HOST}/file_persyaratan/${remoteFilename}`;
  next();
};
