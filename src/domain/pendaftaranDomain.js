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
