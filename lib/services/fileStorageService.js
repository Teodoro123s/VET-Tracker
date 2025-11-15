import { awsStorageService } from './awsStorageService';

// Centralized file storage service - AWS S3 only
export const fileStorageService = {
  async uploadFile(file | Blob, fileName, fileType)  {
    return await awsStorageService.uploadFile(file, fileName, fileType);
  },

  async deleteFile(fileUrl)  {
    return await awsStorageService.deleteFile(fileUrl);
  },

  getFileUrl(fileName) {
    return `https://${process.env.S3_BUCKET_NAME || 'vet-app-storage'}.s3.amazonaws.com/uploads/${fileName}`;
  }
};