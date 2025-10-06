const { PutItemCommand, GetItemCommand, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { dynamoClient, s3Client } = require('../aws-config.js');

const BUCKET_NAME = 'vet-app-images-12345';

const awsService = {
  // Save pet to DynamoDB
  async savePet(pet) {
    const params = {
      TableName: 'VetPets',
      Item: {
        id: { S: pet.id },
        name: { S: pet.name },
        species: { S: pet.species },
        breed: { S: pet.breed || '' },
        owner: { S: pet.owner },
        ownerId: { S: pet.ownerId },
        imageUrl: { S: pet.imageUrl || '' },
        createdAt: { S: new Date().toISOString() }
      }
    };
    
    await dynamoClient.send(new PutItemCommand(params));
    return pet;
  },

  // Get all pets
  async getAllPets() {
    const params = { TableName: 'VetPets' };
    const result = await dynamoClient.send(new ScanCommand(params));
    
    return result.Items?.map(item => ({
      id: item.id.S,
      name: item.name.S,
      species: item.species.S,
      breed: item.breed?.S || '',
      owner: item.owner.S,
      ownerId: item.ownerId.S,
      imageUrl: item.imageUrl?.S || '',
      createdAt: item.createdAt.S
    })) || [];
  },

  // Upload image to S3
  async uploadImage(imageFile, fileName) {
    const params = {
      Bucket: BUCKET_NAME,
      Key: `pets/${Date.now()}-${fileName}`,
      Body: imageFile,
      ContentType: 'image/jpeg'
    };
    
    await s3Client.send(new PutObjectCommand(params));
    return `https://${BUCKET_NAME}.s3.amazonaws.com/${params.Key}`;
  }
};

module.exports = { awsService };