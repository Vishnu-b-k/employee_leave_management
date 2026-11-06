import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { UploadPhase } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const UPLOADS_DIR = path.join(process.cwd(), "uploads", "documents");

// Allowed file types: PDF, PNG, JPG, JPEG, and DOCX
export const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
]);

export const ALLOWED_EXTENSIONS = new Set([
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".docx",
]);

export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export interface StoredDocumentMetadata {
  storageKey: string;
  originalFilename: string;
  mimeType: string;
  fileSizeBytes: number;
  filePath: string;
}

export class DocumentService {
  /**
   * Ensures the uploads directory exists on disk.
   */
  private static async ensureUploadsDir(): Promise<void> {
    try {
      await fs.mkdir(UPLOADS_DIR, { recursive: true });
    } catch {
      // Ignore if exists
    }
  }

  /**
   * Validates file size, extension, and MIME type.
   */
  static validateFile(originalFilename: string, mimeType: string, sizeBytes: number): void {
    if (sizeBytes > MAX_UPLOAD_SIZE_BYTES) {
      throw new Error(`File size exceeds maximum permitted limit of 10MB (${(sizeBytes / (1024 * 1024)).toFixed(1)}MB provided).`);
    }

    const ext = path.extname(originalFilename).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      throw new Error(`Invalid file extension: '${ext}'. Allowed types: PDF, PNG, JPG, JPEG, DOCX.`);
    }

    // Normalized MIME check
    const normalizedMime = mimeType.toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(normalizedMime)) {
      throw new Error(`Invalid file MIME type: '${mimeType}'. Allowed types: PDF, PNG, JPG, JPEG, DOCX.`);
    }
  }

  /**
   * Saves a file buffer locally in a secure storage structure with server-side generated filename.
   */
  static async saveLocalFile(
    fileBuffer: Buffer,
    originalFilename: string,
    mimeType: string
  ): Promise<StoredDocumentMetadata> {
    this.validateFile(originalFilename, mimeType, fileBuffer.length);
    await this.ensureUploadsDir();

    const ext = path.extname(originalFilename).toLowerCase();
    const uniquePrefix = crypto.randomUUID();
    // Server-side generated filename prevents directory traversal and path manipulation
    const storageKey = `${uniquePrefix}${ext}`;
    const destinationPath = path.join(UPLOADS_DIR, storageKey);

    await fs.writeFile(destinationPath, fileBuffer);

    return {
      storageKey,
      originalFilename: originalFilename.replace(/[\r\n\0]/g, ""),
      mimeType,
      fileSizeBytes: fileBuffer.length,
      filePath: destinationPath,
    };
  }

  /**
   * Reads a file buffer by storage key with path traversal prevention.
   */
  static async getLocalFile(storageKey: string): Promise<{ buffer: Buffer; mimeType: string; filename: string } | null> {
    // Strictly isolate to filename only
    const safeKey = path.basename(storageKey);
    const filePath = path.join(UPLOADS_DIR, safeKey);

    try {
      const buffer = await fs.readFile(filePath);
      const doc = await prisma.document.findUnique({
        where: { storage_key: safeKey },
      });
      return {
        buffer,
        mimeType: doc?.mime_type || "application/octet-stream",
        filename: doc?.original_filename || safeKey,
      };
    } catch {
      return null;
    }
  }

  /**
   * Safely deletes a file from disk (e.g. for rollback on failed database transaction).
   */
  static async deleteLocalFile(storageKey: string): Promise<void> {
    const safeKey = path.basename(storageKey);
    const filePath = path.join(UPLOADS_DIR, safeKey);
    try {
      await fs.unlink(filePath);
    } catch {
      // Ignore if not exists
    }
  }

  /**
   * Creates a Document database record in Prisma.
   */
  static async createDocumentRecord(data: {
    leaveRequestId: string;
    uploadedByUserId: string;
    originalFilename: string;
    storageKey: string;
    mimeType: string;
    fileSizeBytes: number;
    uploadPhase?: UploadPhase;
  }) {
    try {
      return await prisma.document.create({
        data: {
          leave_request_id: data.leaveRequestId,
          uploaded_by_user_id: data.uploadedByUserId,
          original_filename: data.originalFilename,
          storage_key: data.storageKey,
          mime_type: data.mimeType,
          file_size_bytes: data.fileSizeBytes,
          upload_phase: data.uploadPhase || UploadPhase.INITIAL,
        },
      });
    } catch (dbErr) {
      // Rollback file on disk if DB creation fails
      await this.deleteLocalFile(data.storageKey);
      throw dbErr;
    }
  }
}
