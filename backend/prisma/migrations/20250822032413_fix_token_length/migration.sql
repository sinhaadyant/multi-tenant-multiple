-- DropIndex
DROP INDEX `sessions_refreshToken_idx` ON `sessions`;

-- DropIndex
DROP INDEX `sessions_token_idx` ON `sessions`;

-- AlterTable
ALTER TABLE `sessions` MODIFY `token` VARCHAR(500) NOT NULL,
    MODIFY `refreshToken` VARCHAR(500) NOT NULL;
