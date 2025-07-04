from utils.tasks.config import *
from collections import Counter
from sklearn.feature_extraction.text import TfidfVectorizer
from bson import ObjectId

def get_paper_info(paper_id):
    # 查询数据库以获取论文信息
    paper = papers_collection.find_one({'_id': paper_id})
    if not paper:
        return None

    paper_info = {
        'keywords': set(),
        'authors': set(),
        'journals': set(),
        'topics': set()
    }
    
    # 提取关键词
    if 'Keywords' in paper:
        keywords = paper['Keywords']
        if isinstance(keywords, str):
            keywords = [k.strip() for k in keywords.split(',')]
        elif isinstance(keywords, (list, set)):
            keywords = list(keywords)
        paper_info['keywords'].update(keywords)

    # 提取作者
    if 'Author' in paper:
        # 如果是字符串，按分隔符拆分成作者列表
        authors = [author.strip() for author in paper['Author'].replace("and", "|").split("|")]
        paper_info['authors'].update(authors)
    
    # 提取期刊
    if 'Series' in paper:
        paper_info['journals'].add(paper['Series'])

    # 提取目标定义
    if 'Target Definition' in paper:
        target_def = paper['Target Definition']
        if 'Target User Group' in target_def:
            paper_info['topics'].add(target_def['Target User Group'])
        if 'Tasks' in target_def:
            paper_info['topics'].add(target_def['Tasks'])
        if 'Application scenarios' in target_def:
            paper_info['topics'].add(target_def['Application scenarios'])

    return paper_info

def get_user_interests(user_id):
    user_id = ObjectId(user_id)
    user_interests = {
        'topics': set(),
        'authors': set(),
        'journals': set(),
        'keywords': set(),
        'user_query': ''
    }

    # 获取用户的Solutions
    solutions = solutions_collection.find({'user_id': user_id})
    
    for solution in solutions:
        user_interests['user_query'] = solution.get('query', '')
        
        # 获取引用的论文
        cites = papers_cited_collection.find({'solution_id': solution['_id']})
        for cite in cites:
            paper_id = cite['paper_id']
            paper_info = get_paper_info(paper_id)
            
            if paper_info:
                user_interests['keywords'].update(paper_info['keywords'])
                # 将作者集合拆分并合并
                user_interests['authors'].update(paper_info['authors'])
                user_interests['journals'].update(paper_info['journals'])
                user_interests['topics'].update(paper_info['topics'])

    return user_interests

def generate_personas(user_id):
    # 获取用户兴趣数据
    user_interests = get_user_interests(user_id)

    # 使用 Counter 统计作者出现次数
    author_counter = Counter()
    for author in user_interests['authors']:
        author_names = [name.strip() for name in author.replace("and", "|").split("|")]
        author_counter.update(author_names)
        
    # 获取出现次数最多的前十名作者
    most_common_authors = author_counter.most_common(10)
    top_authors = [author for author, count in most_common_authors]
    user_interests['authors'] = top_authors

    # 使用 TF-IDF 处理关键词
    if user_interests['keywords']:
        vectorizer = TfidfVectorizer(stop_words='english')
        X = vectorizer.fit_transform(list(user_interests['keywords']))  # 转换为列表
        feature_names = vectorizer.get_feature_names_out()

        tfidf_scores = X.sum(axis=0).A1
        keywords_with_scores = zip(feature_names, tfidf_scores)
        sorted_keywords = sorted(keywords_with_scores, key=lambda x: x[1], reverse=True)
        user_interests['keywords'] = [keyword for keyword, score in sorted_keywords[:10]]
    
    return user_interests
