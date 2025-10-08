import { awsStorageService } from './awsStorageService';

// Centralized file storage service - AWS S3 only
export const fileStorageService = {
  async uploadFile(file: File | Blob, fileName: string, fileType: string): Promise<string> {
    return await awsStorageService.uploadFile(file, fileName, fileType);
  },

  async deleteFile(fileUrl: string): Promise<void> {
    return await awsStorageService.deleteFile(fileUrl);
  },

  getFileUrl(fileName: string): string {
    return `https://${process.env.S3_BUCKET_NAME || 'vet-app-storage'}.s3.amazonaws.com/uploads/${fileName}`;
  }
};