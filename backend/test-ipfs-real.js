const { uploadToIPFS, getIpfsUrl } = require('./utils/ipfs');
const fs = require('fs');
const path = require('path');

async function testRealIPFS() {
  console.log('Testing Pinata (Real IPFS) Integration...\n');

  if (!process.env.PINATA_JWT) {
    console.error('❌ PINATA_JWT is not set in the environment. Please check your .env file.');
    process.exit(1);
  }
  
  try {
    // Create a test file
    const testContent = `This is a test file for IPFS integration.
Created at: ${new Date().toISOString()}
Content: Lorem ipsum dolor sit amet, consectetur adipiscing elit.`;
    
    const testBuffer = Buffer.from(testContent, 'utf8');
    
    console.log('1. Creating test content...');
    console.log('Test content size:', testBuffer.length, 'bytes');
    console.log('Content preview:', testContent.substring(0, 100) + '...\n');
    
    console.log('2. Uploading to IPFS...');
    const startTime = Date.now();
    
    const cid = await uploadToIPFS(testBuffer);
    
    const endTime = Date.now();
    const uploadTime = endTime - startTime;
    
    console.log('✅ Upload successful!');
    console.log('CID:', cid);
    console.log('Upload time:', uploadTime, 'ms');
    console.log('IPFS URL:', getIpfsUrl(cid));
    
    console.log('\n3. Testing file retrieval...');
    console.log('You can access the file at these URLs:');
    console.log('- https://ipfs.io/ipfs/' + cid);
    console.log('- https://gateway.ipfs.io/ipfs/' + cid);
    console.log('- https://dweb.link/ipfs/' + cid);
    
    console.log('\n4. Testing with an image file...');
    
    // Test with a small image file (create a simple base64 encoded image)
    const smallImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const imageBuffer = Buffer.from(smallImageBase64, 'base64');
    
    console.log('Image buffer size:', imageBuffer.length, 'bytes');
    
    const imageCid = await uploadToIPFS(imageBuffer);
    
    console.log('✅ Image upload successful!');
    console.log('Image CID:', imageCid);
    console.log('Image IPFS URL:', getIpfsUrl(imageCid));
    
    console.log('\n🎉 All tests passed! Real IPFS integration is working.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testRealIPFS();
