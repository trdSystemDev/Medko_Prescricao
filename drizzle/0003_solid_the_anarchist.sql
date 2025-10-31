CREATE TABLE `appointments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`doctorId` int NOT NULL,
	`patientId` int NOT NULL,
	`scheduledDate` timestamp NOT NULL,
	`status` enum('agendada','aguardando','em_andamento','finalizada','cancelada') NOT NULL DEFAULT 'agendada',
	`twilioRoomName` varchar(255),
	`twilioRoomSid` varchar(255),
	`startedAt` timestamp,
	`endedAt` timestamp,
	`motivo` text,
	`observacoes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `appointments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `consultationMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`appointmentId` int NOT NULL,
	`senderId` int NOT NULL,
	`senderType` enum('doctor','patient') NOT NULL,
	`message` text NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `consultationMessages_id` PRIMARY KEY(`id`)
);
