import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function generateNomorPendaftaran(gelombangId) {
  const tahun = new Date().getFullYear();
  const kodeGelombang = gelombangId.toString().padStart(2, "0");

  // Hitung jumlah pendaftaran sebelumnya untuk tahun & gelombang yang sama
  const jumlahSebelumnya = await prisma.pendaftaran.count({
    where: {
      gelombangId: gelombangId,
      createdAt: {
        gte: new Date(`${tahun}-01-01`),
        lt: new Date(`${tahun + 1}-01-01`),
      },
    },
  });

  // Nomor urut selanjutnya (increment)
  const nomorUrut = (jumlahSebelumnya + 1).toString().padStart(4, "0");

  const nomorPendaftaran = `${tahun}-${kodeGelombang}-${nomorUrut}`;
  return nomorPendaftaran;
}

export const createPendaftaran = async ({
  calonMahasiswaId,
  gelombangId,
  dataFormulir,
}) => {
  if (!calonMahasiswaId || !gelombangId || !dataFormulir?.nama) {
    throw new Error("Data inti untuk pendaftaran tidak lengkap.");
  }

  const nomorPendaftaran = await generateNomorPendaftaran(gelombangId);
  return {
    nomorPendaftaran,
    calonMahasiswaId,
    gelombangId,
    dataFormulir,
    status: "BARU_MENGISI_FORMULIR",
    dokumenPersyaratan: {
      create: [],
    },
    catatanAdmin: null,
  };
};

export const tambahDokumen = (pendaftaran, namaDokumen, urlPenyimpanan) => {
  // Mengembalikan salinan baru dari pendaftaran dengan dokumen tambahan (prinsip immutability)

  return {
    ...pendaftaran,
    status: "MENUNGGU_VALIDASI_ADMIN",
    dokumenPersyaratan: [{ namaDokumen, urlPenyimpanan }],
  };
};

export const validasiPendaftaran = (pendaftaran, pendafataranData) => {
  if (pendaftaran.status !== "MENUNGGU_VALIDASI_ADMIN") {
    throw new Error("Pendaftaran tidak dalam status menunggu validasi.");
  }

  return {
    ...pendaftaran,
    ...pendafataranData,
  };
};

export const updateDataFormulir = (pendaftaran, dataFormulirBaru) => {
  // Aturan bisnis: data tidak bisa diubah jika status sudah divalidasi
  if (pendaftaran.status === "DATA_LENGKAP") {
    throw new Error("Data tidak dapat diubah setelah divalidasi oleh admin.");
  }

  // Menggabungkan data lama dan baru (data baru akan menimpa yang lama)
  const updatedDataFormulir = {
    ...pendaftaran,
    ...dataFormulirBaru,
  };

  return updatedDataFormulir;
};

export const createAplikasiBeasiswa = (pendaftaran, dataBeasiswa) => {
  // Aturan bisnis untuk status pendaftaran tetap sama
  if (pendaftaran.status !== "DATA_LENGKAP") {
    throw new Error(
      "Anda hanya bisa mengajukan beasiswa setelah data pendaftaran Anda divalidasi."
    );
  }

  // Validasi properti di dalam objek JSON
  const { dataPengajuan } = dataBeasiswa;
  if (
    !dataPengajuan ||
    !dataPengajuan.jenisBeasiswa ||
    !dataPengajuan.alasanPengajuan
  ) {
    throw new Error(
      "Jenis beasiswa dan alasan pengajuan wajib diisi di dalam form."
    );
  }


  return {
    pendaftaranId: pendaftaran.id,
    dataPengajuan: dataPengajuan,
  };
};

export const updateStatusBeasiswa = (aplikasi, newStatus, catatanAdmin) => {
  // Aturan bisnis: misalnya, status yang sudah final (disetujui/ditolak) tidak bisa diubah lagi.
  if (
    aplikasi.statusAplikasi === "DISETUJUI" ||
    aplikasi.statusAplikasi === "DITOLAK"
  ) {
    throw new Error(
      `Status yang sudah ${aplikasi.statusAplikasi} tidak dapat diubah lagi.`
    );
  }

  // Pastikan status baru valid (meskipun sudah dihandle oleh enum, validasi eksplisit itu baik)
  const validStatus = ["DIPROSES", "DISETUJUI", "DITOLAK"];
  if (!validStatus.includes(newStatus)) {
    throw new Error(`Status baru tidak valid: ${newStatus}`);
  }

  return {
    ...aplikasi,
    statusAplikasi: newStatus,
    catatanAdmin: catatanAdmin || aplikasi.catatanAdmin, // Gunakan catatan baru jika ada
  };
};
