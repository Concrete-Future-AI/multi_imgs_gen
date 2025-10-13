/**
 * 测试API响应格式
 */

const fs = require('fs');
const path = require('path');

// 模拟API响应
const mockApiResponse = {
  success: true,
  images: [
    '/generated/generated_1760357833257_0.png',
    '/generated/generated_1760357847404_1.png', 
    '/generated/generated_1760357860942_2.png'
  ],
  analysis: '这是一个产品分析结果',
  prompt: '这是生成的提示词'
};

console.log('🔧 测试API响应格式...');
console.log('模拟API响应:');
console.log(JSON.stringify(mockApiResponse, null, 2));

// 检查图片路径格式
console.log('\n📸 检查图片路径:');
mockApiResponse.images.forEach((imagePath, index) => {
  console.log(`  ${index + 1}. ${imagePath}`);
  
  // 检查文件是否存在
  const fullPath = path.join(process.cwd(), 'public', imagePath.substring(1));
  const exists = fs.existsSync(fullPath);
  console.log(`     文件存在: ${exists ? '✅' : '❌'}`);
  
  if (exists) {
    const stats = fs.statSync(fullPath);
    console.log(`     文件大小: ${stats.size} bytes`);
  }
});

// 检查URL格式
console.log('\n🌐 检查URL格式:');
const baseUrl = 'http://localhost:3001';
mockApiResponse.images.forEach((imagePath, index) => {
  const fullUrl = `${baseUrl}${imagePath}`;
  console.log(`  ${index + 1}. ${fullUrl}`);
});

console.log('\n🎉 API响应测试完成');