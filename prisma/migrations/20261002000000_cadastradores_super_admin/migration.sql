-- Papéis de organizador
ALTER TABLE `Organizador` ADD COLUMN `ativo` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `papel` ENUM('SUPER_ADMIN', 'ORGANIZADOR') NOT NULL DEFAULT 'ORGANIZADOR';

-- O organizador mais antigo vira super admin, para ninguém ficar sem acesso à gestão.
UPDATE `Organizador` SET `papel` = 'SUPER_ADMIN'
WHERE `id` = (SELECT `id` FROM (SELECT `id` FROM `Organizador` ORDER BY `criadoEm` ASC LIMIT 1) AS primeiro);

-- Vários cadastradores por evento: acessos passam a ser numerados por função
ALTER TABLE `Acesso` ADD COLUMN `numero` INTEGER NOT NULL DEFAULT 1;

UPDATE `Acesso` a JOIN `Jurado` j ON j.`id` = a.`juradoId` SET a.`numero` = j.`numero`;

CREATE UNIQUE INDEX `Acesso_eventoId_funcao_numero_key` ON `Acesso`(`eventoId`, `funcao`, `numero`);

DROP INDEX `Acesso_eventoId_funcao_idx` ON `Acesso`;
