const axios = require('axios');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const filePath = path.join(__dirname, 'sample.txt');
    const data = 'Hello IPFS! This is a test file.';

    // Write a sample file
    fs.writeFileSync(filePath, data);

    const fileBuffer = fs.readFileSync(filePath);

    const response = await axios.post('http://localhost:5000/api/submissions/upload', fileBuffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Authorization': 'Bearer YOUR_ACCESS_TOKEN' // Replace with your actual token
      }
    });
    
    console.log('Upload successful:', response.data);
  } catch (error) {
    console.error('Failed to upload file:', error.message);
  }
})();

