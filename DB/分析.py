import nltk
from nltk.corpus import wordnet as wn

# 下载 WordNet 数据
nltk.download('wordnet')

# 定义同义词映射函数
def get_synonym(keyword):
    synonyms = set()
    
    # 获取所有的同义词集（synset）
    for syn in wn.synsets(keyword):
        for lemma in syn.lemmas():
            synonyms.add(lemma.name())  # 添加同义词
    return list(synonyms)

# 定义关键字清洗函数
def clean_keywords(keywords):
    cleaned_keywords = []
    
    for keyword in keywords:
        # 获取同义词集合并简化处理
        synonyms = get_synonym(keyword.lower())  # 转换为小写字母，避免重复
        print(f"Keyword: {keyword}, Synonyms: {synonyms}")
        cleaned_keywords.extend(synonyms)
        
    return list(set(cleaned_keywords))  # 去除重复

# 示例
keywords = ["Human Computer Interaction", "HCI", "Artificial Intelligence", "AI"]
print(clean_keywords(keywords))
