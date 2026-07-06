import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
  UploadedFile as UploadedFileParam,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { UserRole } from '@prisma/client';
import { DocumentsService } from './documents.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { UploadedFile } from '../common/storage/storage.interface';

// 15 MB per file — generous for scans/PDFs while bounding memory use, since
// FileInterceptor buffers the upload in memory before handing it to storage.
const MAX_FILE_BYTES = 15 * 1024 * 1024;

@ApiTags('documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('investors/:investorId/documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.OPERATIONS,
    UserRole.RELATIONSHIP_MANAGER,
    UserRole.COMPLIANCE_OFFICER,
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        category: { type: 'string' },
        type: { type: 'string' },
        expiryDate: { type: 'string', format: 'date' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE_BYTES } }))
  upload(
    @Param('investorId') investorId: string,
    @Body() dto: UploadDocumentDto,
    @UploadedFileParam() file: UploadedFile | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!file) {
      throw new BadRequestException('A file is required (multipart field "file")');
    }
    return this.documentsService.upload(investorId, dto, file, user.userId);
  }

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.OPERATIONS,
    UserRole.COMPLIANCE_OFFICER,
    UserRole.RELATIONSHIP_MANAGER,
    UserRole.PORTFOLIO_MANAGER,
    UserRole.FINANCE,
  )
  list(@Param('investorId') investorId: string) {
    return this.documentsService.listForInvestor(investorId);
  }

  @Get(':documentId/download')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.OPERATIONS,
    UserRole.COMPLIANCE_OFFICER,
    UserRole.RELATIONSHIP_MANAGER,
  )
  async download(@Param('documentId') documentId: string, @Res() res: Response) {
    const { doc, buffer } = await this.documentsService.download(documentId);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${doc.fileName}"`);
    res.send(buffer);
  }

  @Delete(':documentId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS, UserRole.COMPLIANCE_OFFICER)
  remove(@Param('documentId') documentId: string) {
    return this.documentsService.softDelete(documentId);
  }
}
