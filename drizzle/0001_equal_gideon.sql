CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`userRole` varchar(20) NOT NULL,
	`action` varchar(100) NOT NULL,
	`resourceType` varchar(50),
	`resourceId` int,
	`ipAddress` varchar(45),
	`userAgent` text,
	`success` int NOT NULL DEFAULT 1,
	`metadata` text,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `certificates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`doctorId` int NOT NULL,
	`patientId` int NOT NULL,
	`tipo` enum('comparecimento','afastamento','obito') NOT NULL,
	`cid` varchar(10),
	`dataInicio` timestamp,
	`dataFim` timestamp,
	`observacoes` text,
	`assinado` int NOT NULL DEFAULT 0,
	`assinaturaData` timestamp,
	`assinaturaCertificado` text,
	`pdfUrl` text,
	`qrCodeData` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `certificates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `examRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`doctorId` int NOT NULL,
	`patientId` int NOT NULL,
	`exames` text NOT NULL,
	`observacoes` text,
	`assinado` int NOT NULL DEFAULT 0,
	`assinaturaData` timestamp,
	`assinaturaCertificado` text,
	`pdfUrl` text,
	`qrCodeData` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `examRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` text NOT NULL,
	`codigoTuss` varchar(20),
	`codigoSus` varchar(20),
	`descricao` text,
	`categoria` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `exams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `medications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`codigo` varchar(50),
	`numeroRegistro` varchar(50),
	`nomeProduto` text NOT NULL,
	`numeroProcesso` varchar(50),
	`empresaNome` text,
	`empresaCnpj` varchar(20),
	`principioAtivo` text,
	`tarja` varchar(50),
	`apresentacoes` text,
	`medicamentoReferencia` text,
	`classesTerapeuticas` text,
	`categoriaRegulatoria` varchar(50),
	`bulaTxt` text,
	`bulaPdfUrl` text,
	`bulaTxtProfissional` text,
	`bulaPdfProfissionalUrl` text,
	`situacaoRegistro` varchar(20),
	`indicacao` text,
	`dataProduto` timestamp,
	`dataVencimentoRegistro` timestamp,
	`dataPublicacao` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `medications_id` PRIMARY KEY(`id`),
	CONSTRAINT `medications_numeroProcesso_unique` UNIQUE(`numeroProcesso`)
);
--> statement-breakpoint
CREATE TABLE `messageLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`doctorId` int NOT NULL,
	`patientId` int NOT NULL,
	`documentType` varchar(50) NOT NULL,
	`documentId` int NOT NULL,
	`canal` enum('sms','whatsapp') NOT NULL,
	`destinatario` varchar(20) NOT NULL,
	`mensagem` text,
	`status` varchar(50) NOT NULL DEFAULT 'enviando',
	`zenviaMessageId` varchar(100),
	`dataEnvio` timestamp NOT NULL DEFAULT (now()),
	`dataEntrega` timestamp,
	`dataLeitura` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `messageLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `patients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`doctorId` int NOT NULL,
	`nomeCompleto` text NOT NULL,
	`cpf` varchar(255),
	`rg` varchar(255),
	`dataNascimento` varchar(255),
	`sexo` varchar(1),
	`telefone` varchar(255),
	`email` varchar(255),
	`endereco` text,
	`observacoes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `patients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prescriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`doctorId` int NOT NULL,
	`patientId` int NOT NULL,
	`tipoReceituario` enum('simples','controle_especial','azul','amarela','retinoides','talidomida') NOT NULL,
	`medicamentos` text NOT NULL,
	`orientacoes` text,
	`assinado` int NOT NULL DEFAULT 0,
	`assinaturaData` timestamp,
	`assinaturaCertificado` text,
	`pdfUrl` text,
	`qrCodeData` text,
	`dataValidade` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `prescriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`doctorId` int NOT NULL,
	`tipo` enum('prescricao','atestado','exame') NOT NULL,
	`nome` varchar(255) NOT NULL,
	`dados` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','doctor') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `crm` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `crmUf` varchar(2);--> statement-breakpoint
ALTER TABLE `users` ADD `especialidade` text;--> statement-breakpoint
ALTER TABLE `users` ADD `rqe` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `endereco` text;--> statement-breakpoint
ALTER TABLE `users` ADD `telefone` varchar(20);