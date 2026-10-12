-- Premiação conduzida pelo locutor: o telão só mostra as posições que ele revelar
ALTER TABLE `EstadoDesfile` ADD COLUMN `premiacaoCategoriaId` VARCHAR(191) NULL,
    ADD COLUMN `premiacaoReveladas` VARCHAR(191) NOT NULL DEFAULT '';
