/**
 * Pipeline测试脚本
 * 
 * 自动测试两种类型的图片生成：
 * 1. 产品特写图
 * 2. 场景图
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execPromise = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTest(testName, command) {
  console.log('\n' + '='.repeat(80));
  console.log(`🧪 测试: ${testName}`);
  console.log('='.repeat(80));
  console.log(`📝 命令: ${command}\n`);
  
  try {
    const { stdout, stderr } = await execPromise(command, {
      cwd: __dirname,
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });
    
    if (stdout) {
      console.log(stdout);
    }
    if (stderr) {
      console.error('stderr:', stderr);
    }
    
    console.log(`\n✅ 测试 "${testName}" 完成`);
    return true;
  } catch (error) {
    console.error(`\n❌ 测试 "${testName}" 失败:`, error.message);
    if (error.stdout) console.log('stdout:', error.stdout);
    if (error.stderr) console.error('stderr:', error.stderr);
    return false;
  }
}

async function main() {
  console.log('\n🚀 开始Pipeline功能测试');
  console.log('📋 测试计划:');
  console.log('   1. 产品特写图生成');
  console.log('   2. 场景图生成');
  console.log('');
  
  const results = [];
  
  // 测试1: 产品特写图
  const test1Result = await runTest(
    '产品特写图生成',
    'node pipeline-full.js stone_img.jpg closeup'
  );
  results.push({ name: '产品特写图', success: test1Result });
  
  // 延迟5秒，避免API限流
  console.log('\n⏳ 等待5秒后进行下一个测试...\n');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // 测试2: 场景图
  const test2Result = await runTest(
    '场景图生成',
    'node pipeline-full.js stone_img.jpg scene "木质咖啡桌上，旁边有一杯拿铁咖啡和一本打开的书，温暖的午后阳光"'
  );
  results.push({ name: '场景图', success: test2Result });
  
  // 打印测试总结
  console.log('\n' + '='.repeat(80));
  console.log('📊 测试总结');
  console.log('='.repeat(80));
  
  results.forEach((result, index) => {
    const status = result.success ? '✅ 通过' : '❌ 失败';
    console.log(`   ${index + 1}. ${result.name}: ${status}`);
  });
  
  const passCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log('');
  console.log(`🎯 总计: ${passCount}/${totalCount} 通过`);
  console.log('='.repeat(80));
  
  if (passCount === totalCount) {
    console.log('\n🎉 所有测试通过！');
  } else {
    console.log('\n⚠️  部分测试失败，请检查错误信息');
  }
}

main().catch(error => {
  console.error('测试运行失败:', error);
  process.exit(1);
});
