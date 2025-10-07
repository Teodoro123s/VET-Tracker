// Mock AWS config for React Native compatibility
const mockClient = {
  send: async () => ({ Items: [] })
};

module.exports = { 
  dynamoClient: mockClient, 
  s3Client: mockClient 
};