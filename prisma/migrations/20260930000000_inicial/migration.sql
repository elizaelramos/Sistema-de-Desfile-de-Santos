-- CreateTable
CREATE TABLE `Organizador` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `senhaHash` VARCHAR(191) NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Organizador_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SessaoOrganizador` (
    `id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `organizadorId` VARCHAR(191) NOT NULL,
    `expiraEm` DATETIME(3) NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `SessaoOrganizador_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Evento` (
    `id` VARCHAR(191) NOT NULL,
    `organizadorId` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `data` DATETIME(3) NOT NULL,
    `local` VARCHAR(191) NOT NULL DEFAULT '',
    `slugPublico` VARCHAR(191) NOT NULL,
    `desempateIdade` ENUM('MAIS_VELHO', 'MAIS_NOVO') NOT NULL DEFAULT 'MAIS_VELHO',
    `exibirPrimeiroNome` BOOLEAN NOT NULL DEFAULT false,
    `status` ENUM('ATIVO', 'ENCERRADO') NOT NULL DEFAULT 'ATIVO',
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Evento_slugPublico_key`(`slugPublico`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Categoria` (
    `id` VARCHAR(191) NOT NULL,
    `eventoId` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `idadeMin` INTEGER NOT NULL,
    `idadeMax` INTEGER NOT NULL,
    `ordem` INTEGER NOT NULL,
    `status` ENUM('AGUARDANDO', 'EM_ANDAMENTO', 'FECHADA', 'REVELADA') NOT NULL DEFAULT 'AGUARDANDO',
    `fechadaEm` DATETIME(3) NULL,
    `reveladaEm` DATETIME(3) NULL,

    INDEX `Categoria_eventoId_ordem_idx`(`eventoId`, `ordem`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Quesito` (
    `id` VARCHAR(191) NOT NULL,
    `eventoId` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `ordem` INTEGER NOT NULL,

    INDEX `Quesito_eventoId_ordem_idx`(`eventoId`, `ordem`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Jurado` (
    `id` VARCHAR(191) NOT NULL,
    `eventoId` VARCHAR(191) NOT NULL,
    `numero` INTEGER NOT NULL,
    `nome` VARCHAR(191) NULL,

    UNIQUE INDEX `Jurado_eventoId_numero_key`(`eventoId`, `numero`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Acesso` (
    `id` VARCHAR(191) NOT NULL,
    `eventoId` VARCHAR(191) NOT NULL,
    `funcao` ENUM('CADASTRO', 'FILA', 'LOCUTOR', 'JURADO') NOT NULL,
    `juradoId` VARCHAR(191) NULL,
    `token` VARCHAR(191) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `Acesso_juradoId_key`(`juradoId`),
    UNIQUE INDEX `Acesso_token_key`(`token`),
    INDEX `Acesso_eventoId_funcao_idx`(`eventoId`, `funcao`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Sessao` (
    `id` VARCHAR(191) NOT NULL,
    `acessoId` VARCHAR(191) NOT NULL,
    `nomePessoa` VARCHAR(191) NOT NULL,
    `ultimoAcesso` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Sessao_acessoId_ultimoAcesso_idx`(`acessoId`, `ultimoAcesso`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Participante` (
    `id` VARCHAR(191) NOT NULL,
    `eventoId` VARCHAR(191) NOT NULL,
    `categoriaId` VARCHAR(191) NOT NULL,
    `numero` INTEGER NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `idade` INTEGER NOT NULL,
    `santo` VARCHAR(191) NOT NULL,
    `status` ENUM('AGUARDANDO', 'PRESENTE', 'AUSENTE', 'DESFILOU') NOT NULL DEFAULT 'AGUARDANDO',
    `posicaoFila` INTEGER NOT NULL,
    `desfilouEm` DATETIME(3) NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Participante_categoriaId_posicaoFila_idx`(`categoriaId`, `posicaoFila`),
    UNIQUE INDEX `Participante_eventoId_numero_key`(`eventoId`, `numero`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Nota` (
    `id` VARCHAR(191) NOT NULL,
    `participanteId` VARCHAR(191) NOT NULL,
    `juradoId` VARCHAR(191) NOT NULL,
    `quesitoId` VARCHAR(191) NOT NULL,
    `valor` INTEGER NOT NULL,
    `confirmadaEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Nota_participanteId_juradoId_quesitoId_key`(`participanteId`, `juradoId`, `quesitoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EstadoDesfile` (
    `eventoId` VARCHAR(191) NOT NULL,
    `categoriaAtualId` VARCHAR(191) NULL,
    `participanteAtualId` VARCHAR(191) NULL,
    `atualizadoEm` DATETIME(3) NOT NULL,

    PRIMARY KEY (`eventoId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Resultado` (
    `id` VARCHAR(191) NOT NULL,
    `categoriaId` VARCHAR(191) NOT NULL,
    `participanteId` VARCHAR(191) NOT NULL,
    `posicao` INTEGER NOT NULL,
    `media` DOUBLE NOT NULL,
    `criterioDesempate` VARCHAR(191) NULL,
    `sorteioEm` DATETIME(3) NULL,

    UNIQUE INDEX `Resultado_categoriaId_posicao_key`(`categoriaId`, `posicao`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Ocorrencia` (
    `id` VARCHAR(191) NOT NULL,
    `eventoId` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `descricao` TEXT NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SessaoOrganizador` ADD CONSTRAINT `SessaoOrganizador_organizadorId_fkey` FOREIGN KEY (`organizadorId`) REFERENCES `Organizador`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Evento` ADD CONSTRAINT `Evento_organizadorId_fkey` FOREIGN KEY (`organizadorId`) REFERENCES `Organizador`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Categoria` ADD CONSTRAINT `Categoria_eventoId_fkey` FOREIGN KEY (`eventoId`) REFERENCES `Evento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Quesito` ADD CONSTRAINT `Quesito_eventoId_fkey` FOREIGN KEY (`eventoId`) REFERENCES `Evento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Jurado` ADD CONSTRAINT `Jurado_eventoId_fkey` FOREIGN KEY (`eventoId`) REFERENCES `Evento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Acesso` ADD CONSTRAINT `Acesso_eventoId_fkey` FOREIGN KEY (`eventoId`) REFERENCES `Evento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Acesso` ADD CONSTRAINT `Acesso_juradoId_fkey` FOREIGN KEY (`juradoId`) REFERENCES `Jurado`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Sessao` ADD CONSTRAINT `Sessao_acessoId_fkey` FOREIGN KEY (`acessoId`) REFERENCES `Acesso`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Participante` ADD CONSTRAINT `Participante_eventoId_fkey` FOREIGN KEY (`eventoId`) REFERENCES `Evento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Participante` ADD CONSTRAINT `Participante_categoriaId_fkey` FOREIGN KEY (`categoriaId`) REFERENCES `Categoria`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Nota` ADD CONSTRAINT `Nota_participanteId_fkey` FOREIGN KEY (`participanteId`) REFERENCES `Participante`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Nota` ADD CONSTRAINT `Nota_juradoId_fkey` FOREIGN KEY (`juradoId`) REFERENCES `Jurado`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Nota` ADD CONSTRAINT `Nota_quesitoId_fkey` FOREIGN KEY (`quesitoId`) REFERENCES `Quesito`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EstadoDesfile` ADD CONSTRAINT `EstadoDesfile_eventoId_fkey` FOREIGN KEY (`eventoId`) REFERENCES `Evento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Resultado` ADD CONSTRAINT `Resultado_categoriaId_fkey` FOREIGN KEY (`categoriaId`) REFERENCES `Categoria`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Resultado` ADD CONSTRAINT `Resultado_participanteId_fkey` FOREIGN KEY (`participanteId`) REFERENCES `Participante`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ocorrencia` ADD CONSTRAINT `Ocorrencia_eventoId_fkey` FOREIGN KEY (`eventoId`) REFERENCES `Evento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
