// Mock AWS service to prevent bundling issues
const awsService = {
  // Mock save pet function
  async savePet(pet) {
    console.log('AWS service not configured - pet data would be saved:', pet);
    return pet;
  },

  // Mock get all pets function
  async getAllPets() {
    console.log('AWS service not configured - returning empty array');
    return [];
  },

  // Mock upload image function
  async uploadImage(imageFile, fileName) {
    console.log('AWS service not configured - image upload skipped:', fileName);
    // Return a placeholder URL
    return `https://placeholder.com/images/${fileName}`;
  }
};

export { awsService };