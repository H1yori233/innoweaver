# 文件上传功能测试

这是一个测试文件，用于验证Chat页面的文件上传功能是否正常工作。

## 支持的文件格式

- **文本文件**: .txt
- **Markdown文件**: .md, .markdown  
- **PDF文件**: .pdf
- **Word文档**: .docx
- **Excel文件**: .xls, .xlsx
- **CSV文件**: .csv

## 功能特性

1. 文件大小限制：1MB
2. 支持拖拽上传
3. 自动提取文件内容
4. 显示文件类型图标
5. 错误处理和用户提示

## 测试内容

这个文件应该能够被正确上传和解析，提取出其中的文本内容供AI分析使用。

### 代码示例

```javascript
// 文件上传处理示例
const handleFileUpload = (file) => {
  if (file.size > MAX_FILE_SIZE) {
    showError("文件过大");
    return;
  }
  
  const content = await extractFileContent(file);
  // 处理文件内容...
};
```

## 总结

文件上传功能已经优化完成，支持多种常见文件格式，提供了良好的用户体验。 