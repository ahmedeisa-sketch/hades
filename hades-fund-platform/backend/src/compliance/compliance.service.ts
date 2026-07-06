import { Injectable } from '@nestjs/common';
import {
  DocumentType,
  InvestorStatus,
  ReviewStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// Documents every onboarded investor must have on file. Identity is
// satisfied by EITHER a passport OR an Emirates ID; the rest are each
// individually required.
const REQUIRED_IDENTITY_TYPES: DocumentType[] = [
  DocumentType.PASSPORT,
  DocumentType.EMIRATES_ID,
];
const REQUIRED_DOCUMENT_TYPES: DocumentType[] = [
  DocumentType.KYC_FORM,
  DocumentType.AML_FORM,
  DocumentType.SOURCE_OF_FUNDS,
];

// Investors past DRAFT are expected to have documents; DRAFT records are
// still being created and shouldn't raise "missing document" noise.
const DOCUMENT_EXPECTED_STATUSES: InvestorStatus[] = [
  InvestorStatus.DOCUMENTS_UPLOADED,
  InvestorStatus.KYC_REVIEW,
  InvestorStatus.COMPLIANCE_REVIEW,
  InvestorStatus.APPROVED,
  InvestorStatus.FUNDED,
  InvestorStatus.ACTIVE,
];

const EXPIRING_SOON_DAYS = 30;

@Injectable()
export class ComplianceService {
  constructor(private readonly prisma: PrismaService) {}

  private missingRequiredTypes(presentTypes: Set<DocumentType>): DocumentType[] {
    const missing: DocumentType[] = [];

    const hasIdentity = REQUIRED_IDENTITY_TYPES.some((t) => presentTypes.has(t));
    if (!hasIdentity) missing.push(DocumentType.PASSPORT); // representative identity gap

    for (const type of REQUIRED_DOCUMENT_TYPES) {
      if (!presentTypes.has(type)) missing.push(type);
    }
    return missing;
  }

  /**
   * Investors past DRAFT that are missing one or more required documents.
   */
  async getMissingDocuments() {
    const investors = await this.prisma.investor.findMany({
      where: { deletedAt: null, status: { in: DOCUMENT_EXPECTED_STATUSES } },
      select: {
        id: true,
        clientId: true,
        fullName: true,
        status: true,
        documents: {
          where: { deletedAt: null },
          select: { type: true },
        },
      },
    });

    return investors
      .map((inv) => {
        const present = new Set(inv.documents.map((d) => d.type));
        const missing = this.missingRequiredTypes(present);
        return {
          investorId: inv.id,
          clientId: inv.clientId,
          fullName: inv.fullName,
          status: inv.status,
          missing,
        };
      })
      .filter((row) => row.missing.length > 0);
  }

  /**
   * Documents that are expired or expiring within EXPIRING_SOON_DAYS.
   */
  async getDocumentAlerts() {
    const now = new Date();
    const soon = new Date(now.getTime() + EXPIRING_SOON_DAYS * 24 * 60 * 60 * 1000);

    const docs = await this.prisma.investorDocument.findMany({
      where: {
        deletedAt: null,
        expiryDate: { not: null, lte: soon },
      },
      orderBy: { expiryDate: 'asc' },
      select: {
        id: true,
        type: true,
        fileName: true,
        expiryDate: true,
        investor: { select: { id: true, clientId: true, fullName: true } },
      },
    });

    const expired: typeof docs = [];
    const expiringSoon: typeof docs = [];
    for (const doc of docs) {
      if (doc.expiryDate && doc.expiryDate < now) expired.push(doc);
      else expiringSoon.push(doc);
    }
    return { expired, expiringSoon };
  }

  /**
   * Investors whose KYC / AML / Source-of-funds review is still pending or
   * has been escalated — i.e. the compliance officer's work queue.
   */
  async getReviewQueue() {
    const pendingOrEscalated = {
      in: [ReviewStatus.PENDING, ReviewStatus.ESCALATED],
    };
    return this.prisma.investor.findMany({
      where: {
        deletedAt: null,
        status: { in: DOCUMENT_EXPECTED_STATUSES },
        OR: [
          { kycStatus: pendingOrEscalated },
          { amlStatus: pendingOrEscalated },
          { sourceOfFundsStatus: pendingOrEscalated },
        ],
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        clientId: true,
        fullName: true,
        status: true,
        kycStatus: true,
        amlStatus: true,
        sourceOfFundsStatus: true,
        riskRating: true,
      },
    });
  }

  /** Headline counts for the Compliance Center dashboard. */
  async getOverview() {
    const [missing, alerts, queue, kycPending, amlPending, sofPending] =
      await Promise.all([
        this.getMissingDocuments(),
        this.getDocumentAlerts(),
        this.getReviewQueue(),
        this.prisma.investor.count({
          where: { deletedAt: null, kycStatus: ReviewStatus.PENDING },
        }),
        this.prisma.investor.count({
          where: { deletedAt: null, amlStatus: ReviewStatus.PENDING },
        }),
        this.prisma.investor.count({
          where: { deletedAt: null, sourceOfFundsStatus: ReviewStatus.PENDING },
        }),
      ]);

    return {
      investorsMissingDocuments: missing.length,
      expiredDocuments: alerts.expired.length,
      expiringSoonDocuments: alerts.expiringSoon.length,
      reviewQueueSize: queue.length,
      kycPending,
      amlPending,
      sourceOfFundsPending: sofPending,
    };
  }
}
