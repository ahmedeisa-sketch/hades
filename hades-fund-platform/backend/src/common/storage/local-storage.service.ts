import { Injectable, NotFoundException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join, resolve, sep } from 'path';
import { randomUUID } from 'crypto';
import { StorageService, StoredObject, UploadedFile } from './storage.interface';

/**
 * Local filesystem implementation of StorageService — the default for
 * development and the docker-compose stack. Files are written under
 * STORAGE_LOCAL_DIR (default ./storage). In production, replace with an
 * S3/Azure implementation via STORAGE_PROVIDER (see storage.module.ts).
 */
@Injectable()
export class LocalStorageService implements StorageService {
  private readonly baseDir: string;

  constructor() {
    this.baseDir = resolve(process.env.STORAGE_LOCAL_DIR ?? './storage');
  }

  async put(file: UploadedFile, keyPrefix: string): Promise<StoredObject> {
    // A random suffix guarantees uniqueness so re-uploading the same
    // filename (a new document version) never overwrites a prior object.
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageKey = join(this.sanitizePrefix(keyPrefix), `${randomUUID()}-${safeName}`);
    const absPath = this.toAbsolute(storageKey);

    await fs.mkdir(join(absPath, '..'), { recursive: true });
    await fs.writeFile(absPath, file.buffer);

    return { storageKey };
  }

  async get(storageKey: string): Promise<Buffer> {
    try {
      return await fs.readFile(this.toAbsolute(storageKey));
    } catch {
      throw new NotFoundException('Stored file not found');
    }
  }

  async remove(storageKey: string): Promise<void> {
    try {
      await fs.unlink(this.toAbsolute(storageKey));
    } catch {
      // Idempotent: a missing object is treated as already removed.
    }
  }

  private sanitizePrefix(prefix: string): string {
    return prefix.replace(/[^a-zA-Z0-9/_-]/g, '_');
  }

  /**
   * Resolves a storage key to an absolute path and guarantees it stays
   * inside baseDir, defending against path-traversal via a crafted key.
   */
  private toAbsolute(storageKey: string): string {
    const abs = resolve(this.baseDir, storageKey);
    if (abs !== this.baseDir && !abs.startsWith(this.baseDir + sep)) {
      throw new NotFoundException('Invalid storage key');
    }
    return abs;
  }
}
