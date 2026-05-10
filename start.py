"""
GraphScholar 快速启动脚本
使用前请确保：
1. PostgreSQL已启动并创建了graphscholar数据库
2. Neo4j已启动（可选，如果不需要图谱功能）
3. Ollama已启动并拉取了所需模型（或使用OpenAI）
4. 已配置.env文件
"""

import uvicorn
import sys
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))


def main():
    """启动应用"""
    print("=" * 60)
    print("GraphScholar - 智能学习系统")
    print("=" * 60)
    print("\n正在启动服务...")
    print("访问 http://localhost:8080/docs 查看API文档\n")
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8080,
        reload=True,  # 开发模式自动重载
        log_level="info"
    )


if __name__ == "__main__":
    main()
