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
      `${process.env.GELOMBANG_SERVICE_URL}/api/verifyGelombang/${req.body.gelombangId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const gelombang = await response.json();
    if (gelombang.message !== "Terverifikasi") {
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

    await fetch(
      `${process.env.NOTIFIKASI_SERVICE_URL}/api/notifikasi/handle-event`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventType: "PendaftaranBerhasilDiajukanEvent",
          payload: {
            nama: pendaftaran.dataFormulir.nama,
            email: pendaftaran.dataFormulir.email_aktif,
            nomorPendaftaran: pendaftaran.nomorPendaftaran,
          },
        }),
        method: "POST",
      }
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
export const getPendaftaranByCalonMahasiswaId = async (req, res) => {
  try {
    const pendaftaranId = req.params.calonMahasiswaId;
    const pendaftaran =
      await aplicationService.getPendaftaranByCalonMahasiswaIdUseCase(
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

      await fetch(
        `${process.env.SELEKSI_SERVICE_URL}/api/seleksi/internal/inisiasi-sesi`,
        {
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pendaftaranId: pendaftaran.id,
            calonMahasiswaId: pendaftaran.calonMahasiswaId,
            gelombangId: pendaftaran.gelombangId,
          }),
          method: "POST",
        }
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
    await aplicationService.deletePendaftaranUseCase(
      req.params.pendaftaranId,
      req.user.id
    );
    res.status(200).json({
      message: `Berhasil menghapus pendaftaran by id ${req.params.pendaftaranId}`,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const verifyPendaftaran = async (req, res) => {
  try {
    await aplicationService.getPendaftaranByIdUseCase(req.params.pendaftaranId);
    res.status(200).json({
      message: "Terverifikasi",
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const submitAplikasiBeasiswa = async (req, res) => {
  try {
    const useCaseData = {
      pendaftaranId: req.params.pendaftaranId,
      userId: req.user.id,

      formData: {
        dataPengajuan: req.body.dataPengajuan,
      },
    };

    const aplikasi = await aplicationService.submitAplikasiBeasiswaUseCase(
      useCaseData
    );
    res.status(201).json({
      message: "Pengajuan beasiswa berhasil dikirim.",
      data: aplikasi,
    });
  } catch (error) {
    // Blok catch menjadi lebih sederhana karena tidak ada file cleanup
    res.status(400).json({ message: error.message });
  }
};

export const getAllAplikasiBeasiswa = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(401).json({
        message: "Role Admin diperlukan",
      });
    }
    const aplikasi = await aplicationService.getAllAplikasiBeasiswaUseCase();
    res.status(200).json({
      message: "Aplikasi beasiswa berhasil didapatkan",
      data: aplikasi,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getAplikasiBeasiswaById = async (req, res) => {
  try {
    const aplikasi = await aplicationService.getAplikasiBeasiswaByIdUseCase(req.params.beasiswaId);
    res.status(200).json({
      message: "Aplikasi beasiswa berhasil didapatkan",
      data: aplikasi,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getAplikasiBeasiswaByPendaftaranId = async (req, res) => {
  try {
    const aplikasi = await aplicationService.getAplikasiBeasiswaByPendaftaranIdUseCase(req.params.pendaftaranId);
    res.status(200).json({
      message: "Aplikasi beasiswa berhasil didapatkan",
      data: aplikasi,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateStatusBeasiswa = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(401).json({
        message: "Role Admin diperlukan",
      });
    }

    const { newStatus, catatanAdmin } = req.body;
    const useCaseData = {
      aplikasiId: req.params.aplikasiId,
      newStatus,
      catatanAdmin,
    };
    const aplikasi = await aplicationService.adminUpdateStatusBeasiswaUseCase(
      useCaseData
    );
    res.status(200).json({
      message: `Status berhasil diubah menjadi ${newStatus}`,
      data: aplikasi,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
