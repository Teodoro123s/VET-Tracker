const { fileStorageService } = require('../lib/services/fileStorageService');

const BUCKET_NAME = 'vet-app-storage';

const awsService = {
  async savePet(pet) {
    // Use Firebase for data, AWS for images
    return pet;
  },

  async getAllPets() {
    // Use Firebase for data retrieval
    return [];
  },

  async uploadImage(imageFile, fileName) {
    try {
      return await fileStorageService.uploadFile(imageFile, fileName, 'image/jpeg');
    } catch (error) {
      console.error('AWS upload failed:', error);
      return '';
    }
  }
};

module.exports = { awsService };