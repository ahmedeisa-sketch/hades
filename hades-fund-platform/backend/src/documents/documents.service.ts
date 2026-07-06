import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  STORAGE_SERVICE,
  StorageService,
  UploadedFile,
} from '../common/storage/storage.interface';
import { UploadDocumentDto } from './dto/upload-document.dto';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
  ) {}

  private async assertInvestorExists(investorId: string) {
    const investor = await this.prisma.investor.findFirst({
      where: { id: investorId, deletedAt: null },
      select: { id: true },
    });
    if (!investor) throw new NotFoundException('Investor not found');
  }

  /**
   * Uploads a document for an investor. Versioning is automatic: uploading
   * another document of the same type for the same investor produces
   * version N+1 rather than overwriting — earlier versions remain in the
   * table (and in storage) as an auditable history.
   */
  async upload(
    investorId: string,
    dto: UploadDocumentDto,
    file: UploadedFile,
    uploadedBy: string,
  ) {
    await this.assertInvestorExists(investorId);

    const latest = await this.prisma.investorDocument.findFirst({
      where: { investorId, type: dto.type, deletedAt: null },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    const nextVersion = (latest?.version ?? 0) + 1;

    const { storageKey } = await this.storage.put(file, `investors/${investorId}`);

    return this.prisma.investorDocument.create({
      data: {
        investorId,
        category: dto.category,
        type: dto.type,
        fileName: file.originalname,
        storageKey,
        version: nextVersion,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        uploadedBy,
      },
    });
  }

  async listForInvestor(investorId: string) {
    await this.assertInvestorExists(investorId);
    return this.prisma.investorDocument.findMany({
      where: { investorId, deletedAt: null },
      orderBy: [{ type: 'asc' }, { version: 'desc' }],
    });
  }

  async findOne(id: string) {
    const doc = await this.prisma.investorDocument.findFirst({
      where: { id, deletedAt: null },
    });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  /** Returns the document metadata plus its bytes for download/streaming. */
  async download(id: string) {
    const doc = await this.findOne(id);
    const buffer = await this.storage.get(doc.storageKey);
    return { doc, buffer };
  }

  async softDelete(id: string) {
    const doc = await this.findOne(id);
    await this.prisma.investorDocument.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    // Best-effort removal of the underlying object; the row is the source
    // of truth and is already soft-deleted regardless.
    await this.storage.remove(doc.storageKey).catch(() => undefined);
    return { id, deleted: true };
  }
}
