/**
 * 测试存储服务是否正常工作
 */

const fs = require('fs');
const path = require('path');

// 测试创建目录
const testDir = path.join(process.cwd(), 'public', 'generated');

console.log('🔧 测试存储服务...');
console.log(`目标目录: ${testDir}`);

// 检查目录是否存在
if (fs.existsSync(testDir)) {
  console.log('✅ generated目录已存在');
} else {
  console.log('❌ generated目录不存在，正在创建...');
  try {
    fs.mkdirSync(testDir, { recursive: true });
    console.log('✅ generated目录创建成功');
  } catch (error) {
    console.error('❌ 创建目录失败:', error);
  }
}

// 测试写入文件
const testFile = path.join(testDir, 'test.txt');
try {
  fs.writeFileSync(testFile, 'test content');
  console.log('✅ 测试文件写入成功');
  
  // 清理测试文件
  fs.unlinkSync(testFile);
  console.log('✅ 测试文件清理完成');
} catch (error) {
  console.error('❌ 文件操作失败:', error);
}

console.log('🎉 存储服务测试完成');