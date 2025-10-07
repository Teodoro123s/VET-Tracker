// Mock AWS service for React Native compatibility
const awsService = {
  // Save pet (mock implementation)
  async savePet(pet) {
    console.log('Mock: Saving pet to AWS:', pet);
    return pet;
  },

  // Get all pets (mock implementation)
  async getAllPets() {
    console.log('Mock: Getting all pets from AWS');
    return [];
  },

  // Upload image (mock implementation)
  async uploadImage(imageFile, fileName) {
    console.log('Mock: Uploading image to AWS:', fileName);
    return `https://mock-bucket.s3.amazonaws.com/pets/${Date.now()}-${fileName}`;
  }
};

module.exports = { awsService };