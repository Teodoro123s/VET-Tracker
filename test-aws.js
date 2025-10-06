import { ListTablesCommand } from '@aws-sdk/client-dynamodb';
import { dynamoClient } from './aws-config.js';

async function testConnection() {
  try {
    const result = await dynamoClient.send(new ListTablesCommand({}));
    console.log('✅ AWS Connected! Tables:', result.TableNames);
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
  }
}

testConnection();