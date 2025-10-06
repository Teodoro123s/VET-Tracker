const { awsService } = require('./services/aws-service.js');

async function testPetSave() {
  try {
    // Test saving a pet
    const testPet = {
      id: 'pet-' + Date.now(),
      name: 'Buddy',
      species: 'Dog',
      breed: 'Golden Retriever',
      owner: 'John Doe',
      ownerId: 'owner-123'
    };
    
    console.log('Saving pet:', testPet);
    await awsService.savePet(testPet);
    console.log('✅ Pet saved successfully!');
    
    // Test getting all pets
    const pets = await awsService.getAllPets();
    console.log('📋 All pets:', pets);
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testPetSave();