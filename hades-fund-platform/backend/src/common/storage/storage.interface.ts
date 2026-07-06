/**
 * Storage abstraction (Phase 2, Module 4).
 *
 * Documents are stored behind this interface so the rest of the codebase
 * never talks to a concrete provider directly. A local-disk implementation
 * ships for development; a production deployment swaps in S3/Azure Blob by
 * setting STORAGE_PROVIDER and implementing the same three methods — no
 * changes to the Documents module.
 */

export const STORAGE_SERVICE = 'STORAGE_SERVICE';

/**
 * Minimal shape of a Multer-uploaded file. Declared locally rather than
 * importing Express.Multer.File so the build doesn't hard-depend on
 * @types/multer being installed.
 */
export interface UploadedFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface StoredObject {
  /** Provider-specific key/path used to retrieve the object later. */
  storageKey: string;
}

export interface StorageService {
  /**
   * Persist a file and return the key needed to retrieve it. `keyPrefix`
   * lets callers namespace objects (e.g. by investor id).
   */
  put(file: UploadedFile, keyPrefix: string): Promise<StoredObject>;

  /** Retrieve a previously stored object's bytes. */
  get(storageKey: string): Promise<Buffer>;

  /** Remove an object. Implementations should not throw if it's absent. */
  remove(storageKey: string): Promise<void>;
}
