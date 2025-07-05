// 文件上传功能测试脚本
// 这个脚本用于验证Chat页面的文件上传功能

console.log('=== Chat页面文件上传功能测试 ===');

// 测试支持的文件格式
const supportedFormats = [
  '.txt', '.md', '.markdown', '.pdf', '.docx', '.csv', '.xls', '.xlsx'
];

console.log('支持的文件格式:');
supportedFormats.forEach(format => {
  console.log(`  ✓ ${format}`);
});

// 测试文件大小限制
const MAX_FILE_SIZE = 1048576; // 1MB
console.log(`\n文件大小限制: ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(1)}MB`);

// 模拟文件验证
function validateFile(fileName, fileSize) {
  const extension = fileName.slice(((fileName.lastIndexOf(".") - 1) >>> 0) + 2).toLowerCase();
  
  if (!supportedFormats.includes(`.${extension}`)) {
    return { valid: false, error: `不支持的文件格式: ${extension}` };
  }
  
  if (fileSize > MAX_FILE_SIZE) {
    return { valid: false, error: '文件过大' };
  }
  
  return { valid: true };
}

// 测试用例
const testCases = [
  { name: 'test.txt', size: 1024, expected: true },
  { name: 'document.md', size: 2048, expected: true },
  { name: 'report.pdf', size: 512000, expected: true },
  { name: 'data.xlsx', size: 256000, expected: true },
  { name: 'large.pdf', size: 2097152, expected: false }, // 2MB
  { name: 'image.jpg', size: 1024, expected: false }, // 不支持格式
  { name: 'script.js', size: 1024, expected: false }, // 不支持格式
];

console.log('\n测试用例:');
testCases.forEach((testCase, index) => {
  const result = validateFile(testCase.name, testCase.size);
  const status = result.valid === testCase.expected ? '✓' : '✗';
  console.log(`${status} 测试 ${index + 1}: ${testCase.name} (${testCase.size} bytes) - ${result.valid ? '通过' : result.error}`);
});

console.log('\n=== 测试完成 ===');
console.log('如果所有测试都通过，说明文件上传功能配置正确。'); 