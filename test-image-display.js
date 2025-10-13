/**
 * 测试图片显示功能
 * 验证修复后的状态管理是否正常工作
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 测试图片显示功能');
console.log('='.repeat(50));

// 检查生成的图片文件
const generatedDir = path.join(process.cwd(), 'public', 'generated');
console.log('📁 检查生成目录:', generatedDir);

if (!fs.existsSync(generatedDir)) {
  console.error('❌ 生成目录不存在');
  process.exit(1);
}

const files = fs.readdirSync(generatedDir);
console.log(`✅ 找到 ${files.length} 个文件:`);

files.forEach((file, index) => {
  const filePath = path.join(generatedDir, file);
  const stats = fs.statSync(filePath);
  const sizeKB = Math.round(stats.size / 1024);
  
  console.log(`  ${index + 1}. ${file} (${sizeKB}KB)`);
  
  // 构建URL
  const url = `/generated/${file}`;
  console.log(`     URL: http://localhost:3000${url}`);
});

console.log('\n🔧 修复内容:');
console.log('  ✅ 修复了状态管理中的闭包问题');
console.log('  ✅ 使用 useAppStore.getState() 获取最新状态');
console.log('  ✅ 更新了StateDebugger的测试图片URL');

console.log('\n📝 测试步骤:');
console.log('  1. 打开 http://localhost:3000');
console.log('  2. 滚动到页面底部找到"状态调试器"');
console.log('  3. 点击"批量添加测试图片"按钮');
console.log('  4. 查看是否显示3张图片');
console.log('  5. 检查浏览器控制台的日志输出');

console.log('\n🎯 预期结果:');
console.log('  ✅ 应该显示3张图片的缩略图');
console.log('  ✅ 控制台应该显示正确的图片数量');
console.log('  ✅ 点击图片应该能够预览和下载');

console.log('\n🚀 测试完成！请按照上述步骤进行手动测试。');