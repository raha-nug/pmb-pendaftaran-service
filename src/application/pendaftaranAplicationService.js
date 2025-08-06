import * as pendaftaranDomain from "../domain/pendaftaranDomain.js";
import * as pendaftaranRepository from "../infrastructure/pendaftaranRepository.js";

import { deleteFromFTP } from "../interfaces/http/middlewares/fileUpload.js";

/**
 * Use Case 1: Membuat data pendaftaran awal (tanpa dokumen).
 */
export const createInitialPendaftaranUseCase = async (useCaseData) => {
  const { userId, gelombangId, dataFormulir } = useCaseData;

  const pendaftaranState = await pendaftaranDomain.createPendaftaran({
    calonMahasiswaId: userId,
    gelombangId,
    dataFormulir,
  });

  const savedPendaftaran = await pendaftaranRepository.save(pendaftaranState);

  // Terbitkan event
  // publishEvent('PendaftaranAwalDibuatEvent', { pendaftaranId: savedPendaftaran.id });

  return savedPendaftaran;
};

/**
 * Use Case 2: Menambahkan satu dokumen ke pendaftaran yang sudah ada.
 */
export const addDokumenUseCase = async (useCaseData) => {
  const { pendaftaranId, userId, namaDokumen, urlPenyimpanan } = useCaseData;

  // 1. Ambil aggregate pendaftaran yang ada dari database
  const pendaftaranSaatIni = await pendaftaranRepository.findById(
    pendaftaranId
  );
  if (!pendaftaranSaatIni) {
    throw new Error("Pendaftaran tidak ditemukan.");
  }
  // Otorisasi: pastikan user yang mengunggah adalah pemilik pendaftaran
  if (pendaftaranSaatIni.calonMahasiswaId !== userId) {
    throw new Error("Anda tidak memiliki izin untuk mengubah pendaftaran ini.");
  }

  // 2. Gunakan fungsi domain untuk menambahkan dokumen (prinsip immutability)
  const pendaftaranBaru = pendaftaranDomain.tambahDokumen(
    pendaftaranSaatIni,
    namaDokumen,
    urlPenyimpanan
  );

  // 3. Simpan state aggregate yang baru ke database
  const savedPendaftaran = await pendaftaranRepository.addDokumenByPendaftaran(
    pendaftaranId,
    pendaftaranBaru
  );

  // Terbitkan event
  // publishEvent('DokumenBerhasilDitambahkanEvent', { pendaftaranId, namaDokumen: dokumenInfo.namaDokumen });

  return savedPendaftaran;
};

export const deleteDokumenUseCase = async ({ dokumenId, userId }) => {
  // 1. Ambil data dokumen dari DB untuk otorisasi dan mendapatkan path file
  const dokumen = await pendaftaranRepository.findDokumenById(dokumenId);
  if (!dokumen) {
    throw new Error("Dokumen tidak ditemukan.");
  }

  //2. Otorisasi: pastikan user yang menghapus adalah pemilik pendaftaran
  if (dokumen.pendaftaran.calonMahasiswaId !== userId) {
    throw new Error("Anda tidak memiliki izin untuk menghapus dokumen ini.");
  }

  // 3. Hapus record dokumen dari database
  await pendaftaranRepository.deleteDokumenById(dokumenId);

  // 4. Hapus file fisik dari server
  // Ambil path FTP dari URL
  const url = dokumen.urlPenyimpanan;
  const parsedUrl = new URL(url);
  const remotePath = parsedUrl.pathname.slice(1); // Hilangkan '/' di awal

  console.log(remotePath);

  const deleted = await deleteFromFTP(`${remotePath}`);
  if (!deleted) throw new Error("Gagal menghapus file di server FTP");

  return { message: `Dokumen ${dokumen.namaDokumen} berhasil dihapus.` };
};

export const validatePendaftaranUseCase = async (useCaseData) => {
  const { pendaftaranId, userId, pendaftaranData } = useCaseData;

  // 1. Ambil aggregate pendaftaran yang ada dari database
  const pendaftaranSaatIni = await pendaftaranRepository.findById(
    pendaftaranId
  );
  if (!pendaftaranSaatIni) {
    throw new Error("Pendaftaran tidak ditemukan.");
  }

  // 2. Gunakan fungsi domain untuk validasi pendaftaran
  const pendaftaranBaru = pendaftaranDomain.validasiPendaftaran(
    pendaftaranSaatIni,
    pendaftaranData
  );

  // 3. Simpan state aggregate yang baru ke database
  const savedPendaftaran = await pendaftaranRepository.update(
    pendaftaranId,
    pendaftaranBaru
  );

  return savedPendaftaran;
};

export const getPendaftaranByIdUseCase = async (pendaftaranId) => {
  const pendaftaran = await pendaftaranRepository.findById(pendaftaranId);
  if (!pendaftaran) {
    throw new Error("Pendaftaran tidak ditemukan.");
  }
  return pendaftaran;
};

export const getAllPendaftaranUseCase = async () => {
  const daftarPendaftaran = await pendaftaranRepository.findAll();
  return daftarPendaftaran;
};

export const getPendaftaranByCalonMahasiswaIdUseCase = async (
  calonMahasiswaId
) => {
  const daftarPendaftaran = await pendaftaranRepository.findByCalonMahasiswaId(
    calonMahasiswaId
  );
  return daftarPendaftaran;
};

export const updatePendaftaranUseCase = async ({
  pendaftaranId,
  userId,
  pendaftaranData,
}) => {
  const pendaftaranSaatIni = await pendaftaranRepository.findById(
    pendaftaranId
  );

  if (!pendaftaranSaatIni) throw new Error("Pendaftaran tidak ditemukan.");
  if (pendaftaranSaatIni.calonMahasiswaId !== userId)
    throw new Error("Akses ditolak.");

  // Panggil fungsi domain untuk update
  const pendaftaranBaru = pendaftaranDomain.updateDataFormulir(
    pendaftaranSaatIni,
    pendaftaranData
  );

  // Simpan ke DB
  const updatedPendaftaran = await pendaftaranRepository.update(
    pendaftaranId,
    pendaftaranBaru
  );
  return updatedPendaftaran;
};

export const deletePendaftaranUseCase = async (pendaftaranId, userId) => {
  const pendaftaran = await pendaftaranRepository.findById(pendaftaranId);
  if (!pendaftaran) throw new Error("Pendaftaran tidak ditemukan.");
  if (pendaftaran.calonMahasiswaId !== userId)
    throw new Error("Akses ditolak.");

  // Hapus file fisik terlebih dahulu
  for (const doc of pendaftaran.dokumenPersyaratan) {
    try {
      const url = doc.urlPenyimpanan;
      const parsedUrl = new URL(url);
      const remotePath = parsedUrl.pathname.slice(1); // Hilangkan '/' di awal

      const deleted = await deleteFromFTP(`${remotePath}`);
      if (!deleted) throw new Error("Gagal menghapus file di server FTP");
    } catch (err) {
      // Log error jika file tidak ditemukan, tapi lanjutkan proses
      console.error(`Gagal menghapus file ${doc.urlPenyimpanan}:`, err.message);
    }
  }

  // Hapus record pendaftaran dari database
  // (Prisma akan menghapus dokumen terkait secara otomatis karena relasi)
  await pendaftaranRepository.deleteById(pendaftaranId);
  return { message: "Pendaftaran dan semua dokumen terkait berhasil dihapus." };
};

export const submitAplikasiBeasiswaUseCase = async (useCaseData) => {
  const { pendaftaranId, userId, formData } = useCaseData;

  const pendaftaranInduk = await pendaftaranRepository.findById(pendaftaranId);
  if (!pendaftaranInduk) throw new Error("Pendaftaran tidak ditemukan.");
  if (pendaftaranInduk.calonMahasiswaId !== userId)
    throw new Error("Akses ditolak.");
  if (pendaftaranInduk.aplikasiBeasiswa)
    throw new Error("Anda sudah pernah mengajukan beasiswa.");

  // --- PERUBAHAN DI SINI ---
  // 'dokumen' tidak lagi diproses
  const aplikasiData = pendaftaranDomain.createAplikasiBeasiswa(
    pendaftaranInduk,
    formData // formData sekarang hanya berisi dataPengajuan
  );

  return pendaftaranRepository.saveAplikasiBeasiswa(aplikasiData);
};

export const getAllAplikasiBeasiswaUseCase = async () => {
  return pendaftaranRepository.findAllAplikasiBeasiswa();
};

export const adminUpdateStatusBeasiswaUseCase = async ({
  aplikasiId,
  newStatus,
  catatanAdmin,
}) => {
  const aplikasiSaatIni = await pendaftaranRepository.findAplikasiBeasiswaById(
    aplikasiId
  );
  if (!aplikasiSaatIni) {
    throw new Error("Aplikasi beasiswa tidak ditemukan.");
  }

  // Panggil fungsi domain untuk validasi dan mendapatkan state baru
  const aplikasiBaru = pendaftaranDomain.updateStatusBeasiswa(
    aplikasiSaatIni,
    newStatus,
    catatanAdmin
  );

  // Simpan perubahan ke database
  const updatedAplikasi = await pendaftaranRepository.updateAplikasiBeasiswa(
    aplikasiId,
    aplikasiBaru
  );

  // Di sini Anda bisa menerbitkan event 'StatusBeasiswaDiperbaruiEvent'
  // untuk memberitahu Notifikasi Service agar mengirim email ke mahasiswa.
  // publishEvent('StatusBeasiswaDiperbaruiEvent', { ... });

  return updatedAplikasi;
};
