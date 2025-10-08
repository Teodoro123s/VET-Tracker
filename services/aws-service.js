// AWS SDK not compatible with React Native/Expo
// const { PutItemCommand, GetItemCommand, ScanCommand } = require('@aws-sdk/client-dynamodb');
// const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
// const { dynamoClient, s3Client } = require('../aws-config.js');

const BUCKET_NAME = 'vet-app-images-12345';

const awsService = {
  // AWS SDK disabled for React Native/Expo compatibility
  async savePet(pet) {
    console.log('AWS service disabled for mobile');
    return pet;
  },

  async getAllPets() {
    console.log('AWS service disabled for mobile');
    return [];
  },

  async uploadImage(imageFile, fileName) {
    console.log('AWS service disabled for mobile');
    return '';
  }
};

module.exports = { awsService };