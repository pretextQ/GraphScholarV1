import math
from app.core.constants import FSRS_PARAMETERS


class FSRSEngine:
    """FSRS算法引擎"""
    
    def __init__(self):
        self.w = FSRS_PARAMETERS["w"]
        self.request_retention = FSRS_PARAMETERS["request_retention"]
        self.maximum_interval = FSRS_PARAMETERS["maximum_interval"]
    
    def init_state(self) -> dict:
        """初始化学习状态"""
        return {
            "stability": self.w[0],  # 初始稳定性
            "difficulty": self.w[1],  # 初始难度
            "scheduled_days": 1,  # 初始间隔1天
        }
    
    def process_review(self, stability: float, difficulty: float, rating: int, elapsed_days: int) -> dict:
        """
        处理复习反馈
        
        Args:
            stability: 当前稳定性
            difficulty: 当前难度
            rating: 评分 (1-4: again, hard, good, easy)
            elapsed_days: 距离上次复习的天数
        
        Returns:
            更新后的状态字典
        """
        # 计算 retrievability (可检索性)
        retrievability = self._forgetting_curve(elapsed_days, stability)
        
        # 更新稳定性
        new_stability = self._next_stability(stability, difficulty, retrievability, rating)
        
        # 更新难度
        new_difficulty = self._next_difficulty(difficulty, rating)
        
        # 计算下次间隔
        new_interval = self._next_interval(new_stability)
        
        return {
            "stability": new_stability,
            "difficulty": new_difficulty,
            "scheduled_days": new_interval,
        }
    
    def _forgetting_curve(self, elapsed_days: int, stability: float) -> float:
        """遗忘曲线"""
        return (1 + elapsed_days / (9 * stability)) ** -1
    
    def _next_stability(self, stability: float, difficulty: float, retrievability: float, rating: int) -> float:
        """计算下一个稳定性"""
        if rating == 1:  # Again
            # 遗忘后重新学习
            return self.w[0]
        
        # Hard, Good, Easy
        return stability * (1 + math.exp(self.w[8]) * 
                          (11 - difficulty) * 
                          math.pow(stability, -self.w[9]) * 
                          (math.exp((1 - retrievability) * self.w[10]) - 1) * 
                          self._rating_multiplier(rating))
    
    def _next_difficulty(self, difficulty: float, rating: int) -> float:
        """计算下一个难度（FSRS-5 标准公式）"""
        # 基于评分调整难度
        new_difficulty = difficulty + self.w[6] * (rating - 3)
        # 均值回归：防止难度漂移过远
        mean_reversion = self.w[7] * (self.w[1] - new_difficulty)
        return max(1, min(10, new_difficulty + mean_reversion))
    
    def _next_interval(self, stability: float) -> int:
        """计算下次复习间隔"""
        interval = stability * 9 * (1 / self.request_retention - 1)
        return max(1, min(int(round(interval)), self.maximum_interval))
    
    def _rating_multiplier(self, rating: int) -> float:
        """评分乘数"""
        multipliers = {2: 0.8, 3: 1.0, 4: 1.2}
        return multipliers.get(rating, 1.0)


# 全局实例
fsrs_engine = FSRSEngine()
