import { Injectable, NotImplementedException } from '@nestjs/common';
import { StorageService, StoredObject, UploadedFile } from './storage.interface';

/**
 * S3 implementation placeholder.
 *
 * Selected when STORAGE_PROVIDER=s3. Intentionally a stub so the wiring,
 * config, and the rest of the Documents module can ship and be exercised
 * against local storage now, while making the production integration a
 * single, well-scoped file to complete.
 *
 * To finish this:
 *   1. `npm i @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`
 *   2. Construct an S3Client from STORAGE_BUCKET / AWS_REGION / credentials.
 *   3. put()    -> PutObjectCommand (key = `${keyPrefix}/${uuid}-${name}`)
 *      get()    -> GetObjectCommand (or return a presigned URL instead of bytes)
 *      remove() -> DeleteObjectCommand
 * The DocumentsService depends only on the StorageService interface, so no
 * caller changes are required.
 */
@Injectable()
export class S3StorageService implements StorageService {
  private fail(): never {
    throw new NotImplementedException(
      'S3 storage is not configured. Set STORAGE_PROVIDER=local for development, ' +
        'or complete the S3 integration in s3-storage.service.ts.',
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async put(_file: UploadedFile, _keyPrefix: string): Promise<StoredObject> {
    this.fail();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async get(_storageKey: string): Promise<Buffer> {
    this.fail();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async remove(_storageKey: string): Promise<void> {
    this.fail();
  }
}
