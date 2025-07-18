import * as aplicationService from "../../application/pendaftaranAplicationService.js";

/**
 * Controller untuk menangani pembuatan pendaftaran awal.
 */
export const createInitialPendaftaran = async (req, res) => {
  try {
    if (req.user.role === "ADMIN") {
      res.status(403).json({ message: "Admin tidak diperkenankan mendaftar" });
    }

    const token = req.headers.authorization?.split(" ")[1];

    const response = await fetch(
      `${process.env.GELOMBANG_SERVICE_URL}/api/isValidGelombang/${req.body.gelombangId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const gelombang = await response.json();
    if (gelombang.message) {
      return res.status(400).json({
        message: "Id Gelombang tidak valid",
      });
    }

    if (req.user.role !== "CALON_MAHASISWA") {
      return res
        .status(403)
        .json({ error: "Forbidden: Not a calon mahasiswa" });
    }

    const useCaseData = {
      userId: req.user.id,
      gelombangId: req.body.gelombangId,
      dataFormulir: req.body.dataFormulir,
    };

    const pendaftaran = await aplicationService.createInitialPendaftaranUseCase(
      useCaseData
    );
    res.status(201).json({
      message: "Pendaftaran awal berhasil dibuat. Silakan unggah dokumen Anda.",
      data: pendaftaran,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Controller untuk menangani penambahan satu dokumen.
 */
export const addDokumen = async (req, res) => {
  try {
    // req.file disediakan oleh multer.single()
    if (!req.file) {
      return res.status(400).json({ message: "File dokumen harus diunggah." });
    }

    const useCaseData = {
      pendaftaranId: req.params.pendaftaranId,
      userId: req.user.id, // dari middleware otentikasi
      namaDokumen: req.body.namaDokumen || req.file.originalname,
      urlPenyimpanan: req.uploadedFileUrl,
    };

    const pendaftaran = await aplicationService.addDokumenUseCase(useCaseData);
    res.status(200).json({
      message: `Dokumen '${useCaseData.namaDokumen}' berhasil diunggah.`,
      data: pendaftaran,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteDokumen = async (req, res) => {
  try {
    const useCaseData = {
      dokumenId: req.params.dokumenId,
      userId: req.user.id, // dari middleware otentikasi
    };
    const result = await aplicationService.deleteDokumenUseCase(useCaseData);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Controller untuk mendapatkan semua pendaftaran.
 */
export const getAllPendaftaran = async (req, res) => {
  try {
    const pendaftaranList = await aplicationService.getAllPendaftaranUseCase();
    res.status(200).json({
      message: "Daftar pendaftaran berhasil diambil.",
      data: pendaftaranList,
    });
  } catch (error) {
    console.error("Error fetching pendaftaran list:", error);
    res.status(500).json({ message: "Gagal mengambil daftar pendaftaran." });
  }
};

export const getPendaftaranById = async (req, res) => {
  try {
    const pendaftaranId = req.params.pendaftaranId;
    const pendaftaran = await aplicationService.getPendaftaranByIdUseCase(
      pendaftaranId
    );

    if (!pendaftaran) {
      return res.status(404).json({ message: "Pendaftaran tidak ditemukan." });
    }

    res.status(200).json({
      message: "Pendaftaran berhasil diambil.",
      data: pendaftaran,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updatePendaftaran = async (req, res) => {
  try {
    const useCaseData = {
      pendaftaranId: req.params.pendaftaranId,
      userId: req.user.id,
      pendaftaranData: req.body,
    };

    if (req.user.role === "ADMIN") {
      const pendaftaran = await aplicationService.validatePendaftaranUseCase(
        useCaseData
      );

      return res.status(200).json({
        message: "Pendaftaran berhasil divalidasi.",
        data: pendaftaran,
      });
    } else if (req.user.role === "CALON_MAHASISWA") {
      const pendaftaran = await aplicationService.updatePendaftaranUseCase(
        useCaseData
      );

      return res.status(200).json({
        message: "Data pendaftaran berhasil diperbarui.",
        data: pendaftaran,
      });
    } else {
      return res.status(403).json({ message: "Akses ditolak." });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deletePendaftaran = async (req, res) => {
  try {
    const useCaseData = {
      pendaftaranId: req.params.pendaftaranId,
      userId: req.user.id,
    };
    const result = await aplicationService.deletePendaftaranUseCase(
      useCaseData
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
