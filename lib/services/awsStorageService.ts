const AWS_API_ENDPOINT = 'https://your-api-gateway-url.amazonaws.com/prod';

export const awsStorageService = {
  async uploadFile(file: File | Blob, fileName: string, fileType: string) {
    try {
      // Get presigned URL from your backend
      const response = await fetch(`${AWS_API_ENDPOINT}/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName, fileType })
      });
      
      const { uploadUrl, fileUrl } = await response.json();
      
      // Upload file to S3 using presigned URL
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': fileType }
      });
      
      return fileUrl;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  },

  async deleteFile(fileUrl: string) {
    try {
      const fileName = fileUrl.split('/').pop();
      await fetch(`${AWS_API_ENDPOINT}/delete-file`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName })
      });
    } catch (error) {
      console.error('Delete failed:', error);
      throw error;
    }
  }
};