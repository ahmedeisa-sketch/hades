import { Global, Module } from '@nestjs/common';
import { STORAGE_SERVICE } from './storage.interface';
import { LocalStorageService } from './local-storage.service';
import { S3StorageService } from './s3-storage.service';

/**
 * Global storage module. Binds the STORAGE_SERVICE token to a concrete
 * implementation chosen at boot from STORAGE_PROVIDER (default: local).
 * Marked @Global so any feature module can inject STORAGE_SERVICE without
 * re-importing this module.
 */
@Global()
@Module({
  providers: [
    LocalStorageService,
    S3StorageService,
    {
      provide: STORAGE_SERVICE,
      inject: [LocalStorageService, S3StorageService],
      useFactory: (local: LocalStorageService, s3: S3StorageService) => {
        const provider = (process.env.STORAGE_PROVIDER ?? 'local').toLowerCase();
        return provider === 's3' ? s3 : local;
      },
    },
  ],
  exports: [STORAGE_SERVICE],
})
export class StorageModule {}
