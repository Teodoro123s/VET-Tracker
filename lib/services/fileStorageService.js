// File storage service placeholder (AWS references removed)
export const fileStorageService = {
  async uploadFile(_file, _fileName, _fileType) {
    throw new Error('File storage service not implemented. Configure `fileStorageService` to use Firebase Storage or another provider.');
  },
  async deleteFile(_fileUrl) {
    throw new Error('File storage service not implemented.');
  },
  getFileUrl(_fileName) {
    throw new Error('File storage service not implemented.');
  }
};