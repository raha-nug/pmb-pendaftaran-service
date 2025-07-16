import multer from "multer";
import path from "path";
import { Client } from "basic-ftp";
import dotenv from "dotenv";
import stream from "stream";
dotenv.config();

async function uploadToFTP(buffer, remoteFilename) {
  const client = new Client();
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      secure: false, // Set to true if using FTPS
    });

    await client.ensureDir(process.env.FTP_REMOTE_DIR);

    const passThrough = new stream.PassThrough();
    passThrough.end(buffer);

    await client.uploadFrom(
      passThrough,
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

const storage = multer.memoryStorage();




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

 // Generate nama file unik
 const ext = path.extname(req.file.originalname);
 const remoteFilename = `filePersyaratan-${Date.now()}-${Math.round(
   Math.random() * 1e9
 )}${ext}`;

 // Upload dari buffer
 const success = await uploadToFTP(req.file.buffer, remoteFilename);

 if (!success) {
   return res.status(500).json({ message: "Gagal upload ke FTP" });
 }


  // Simpan URL ke dalam request
  req.uploadedFileUrl = `https://${process.env.FTP_HOST}/${process.env.FTP_REMOTE_DIR || "file_persyaratan"}/${remoteFilename}`;
  next();
};