import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { UploadPhase } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const UPLOADS_DIR = path.join(process.cwd(), "uploads", "documents");

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
   * Saves a file buffer locally in a secure storage structure.
   */
  static async saveLocalFile(
    fileBuffer: Buffer,
    originalFilename: string,
    mimeType: string
  ): Promise<StoredDocumentMetadata> {
    await this.ensureUploadsDir();

    const sanitizedName = originalFilename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniquePrefix = crypto.randomUUID();
    const storageKey = `${uniquePrefix}-${sanitizedName}`;
    const destinationPath = path.join(UPLOADS_DIR, storageKey);

    await fs.writeFile(destinationPath, fileBuffer);

    return {
      storageKey,
      originalFilename,
      mimeType,
      fileSizeBytes: fileBuffer.length,
      filePath: destinationPath,
    };
  }

  /**
   * Reads a file buffer by storage key.
   */
  static async getLocalFile(storageKey: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
    const filePath = path.join(UPLOADS_DIR, path.basename(storageKey));
    try {
      const buffer = await fs.readFile(filePath);
      const doc = await prisma.document.findUnique({
        where: { storage_key: storageKey },
      });
      return {
        buffer,
        mimeType: doc?.mime_type || "application/octet-stream",
      };
    } catch {
      return null;
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
    return prisma.document.create({
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
  }
}
