import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Fungsi untuk menyimpan data Pendaftaran beserta dokumennya.
export const save = async (pendaftaranData) => {
  const createdPendaftaran = await prisma.pendaftaran.create({
    data: pendaftaranData,
  });
  return createdPendaftaran;
};

// Fungsi lain tetap sama, mengembalikan plain object.
export const findById = async (pendaftaranId) => {
  return prisma.pendaftaran.findUnique({
    where: { id: pendaftaranId },
    include: { dokumenPersyaratan: true },
  });
};

export const findAll = async () => {
  return prisma.pendaftaran.findMany({
    include: { dokumenPersyaratan: true },
  });
};

export const update = async (pendaftaranId, pendaftaranData) => {
  const { dokumenPersyaratan, ...dataToUpdate } = pendaftaranData;
  return await prisma.pendaftaran.update({
    where: { id: pendaftaranId },
    data: {
      ...dataToUpdate,
    },
    include: { dokumenPersyaratan: true },
  });
};

export const deleteById = async (id) => {
  // Prisma akan otomatis menghapus dokumenPersyaratan yang terhubung
  // karena relasi 'onDelete: Cascade' (default)
  return prisma.pendaftaran.delete({ where: { id } });
};

export const findByCalonMahasiswaId = async (calonMahasiswaId) => {
  return prisma.pendaftaran.findMany({
    where: { calonMahasiswaId },
    include: { dokumenPersyaratan: true },
  });

  //if error
  // return authentication error
};

export const findDokumenById = async (dokumenId) => {
  return prisma.dokumenPersyaratan.findUnique({
    where: { id: dokumenId },
    include: { pendaftaran: true },
  });
};

export const deleteDokumenById = async (dokumenId) => {
  return prisma.dokumenPersyaratan.delete({ where: { id: dokumenId } });
};

export const addDokumenByPendaftaran = async (
  pendaftaranId,
  pendafataranData
) => {
  const { dokumenPersyaratan, ...pendaftaran } = pendafataranData;

  return await prisma.pendaftaran.update({
    where: { id: pendaftaranId },
    data: {
      ...pendaftaran,
      dokumenPersyaratan: {
        create: dokumenPersyaratan,
      },
    },
    include: {
      dokumenPersyaratan: true,
    },
  });
};
