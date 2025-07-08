-- CreateTable
CREATE TABLE `pendaftaran` (
    `id` VARCHAR(191) NOT NULL,
    `nomorPendaftaran` VARCHAR(191) NOT NULL,
    `calonMahasiswaId` VARCHAR(191) NOT NULL,
    `gelombangId` VARCHAR(191) NOT NULL,
    `dataFormulir` JSON NOT NULL,
    `status` ENUM('BARU_MENGISI_FORMULIR', 'MENUNGGU_VALIDASI_ADMIN', 'DATA_LENGKAP', 'PERLU_PERBAIKAN') NOT NULL DEFAULT 'BARU_MENGISI_FORMULIR',
    `catatanAdmin` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `pendaftaran_nomorPendaftaran_key`(`nomorPendaftaran`),
    INDEX `pendaftaran_calonMahasiswaId_idx`(`calonMahasiswaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dokumen_persyaratan` (
    `id` VARCHAR(191) NOT NULL,
    `pendaftaranId` VARCHAR(191) NOT NULL,
    `namaDokumen` VARCHAR(191) NOT NULL,
    `urlPenyimpanan` VARCHAR(191) NOT NULL,
    `statusValidasi` VARCHAR(191) NOT NULL DEFAULT 'MENUNGGU_VALIDASI',
    `catatanValidasi` VARCHAR(191) NULL,
    `diunggahPada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `dokumen_persyaratan` ADD CONSTRAINT `dokumen_persyaratan_pendaftaranId_fkey` FOREIGN KEY (`pendaftaranId`) REFERENCES `pendaftaran`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
