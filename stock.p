import yfinance as yf
import pandas as pd
import numpy as np
from backtesting import Backtest, Strategy
from backtesting.lib import crossover

# --- 1. 定義指標計算函數 (使用 Pandas 實作) ---

def RSI(series, period=14):
    """計算 RSI 相對強弱指標"""
    delta = series.diff()
    gain = (delta.where(delta > 0, 0)).fillna(0)
    loss = (-delta.where(delta < 0, 0)).fillna(0)
    
    # 使用 Wilder 的平滑法 (這是標準 RSI 算法)
    avg_gain = gain.ewm(com=period-1, min_periods=period).mean()
    avg_loss = loss.ewm(com=period-1, min_periods=period).mean()
    
    rs = avg_gain / avg_loss
    return 100 - (100 / (1 + rs))

def KD(high, low, close, n=9):
    """計算 KD 隨機指標，回傳 (K, D) 兩個序列"""
    # 1. 計算 RSV (Raw Stochastic Value)
    # RSV = (今日收盤 - 最近n天最低) / (最近n天最高 - 最近n天最低) * 100
    lowest_low = low.rolling(n).min()
    highest_high = high.rolling(n).max()
    rsv = (close - lowest_low) / (highest_high - lowest_low) * 100
    
    # 2. 計算 K 與 D
    # 傳統公式：K = 2/3 * 昨日K + 1/3 * 今日RSV
    # 這在數學上等同於對 RSV 做權重為 1/3 的指數移動平均 (EMA)
    # pandas 的 ewm alpha=1/3 即為此意
    k = rsv.ewm(alpha=1/3, adjust=False).mean()
    d = k.ewm(alpha=1/3, adjust=False).mean()
    
    return k, d

# --- 2. 定義策略類別 ---

class RsiKdStrategy(Strategy):
    # 參數設定 (可優化)
    rsi_period = 14
    kd_period = 9
    rsi_lower = 30  # 超賣界線
    rsi_upper = 70  # 超買界線

    def init(self):
        # 準備 RSI 資料
        self.rsi = self.I(RSI, pd.Series(self.data.Close), self.rsi_period)
        
        # 準備 KD 資料 (注意要傳入 High, Low, Close)
        # self.I 只能接受回傳一個陣列的函數，所以這裡我們稍微變通一下，分開呼叫
        # 但為了方便，我們直接在 init 計算好，然後用 self.I 包裝成指標以便繪圖
        
        # 為了讓 backtesting.py 能畫圖，我們通常要把計算邏輯包在 helper 裡
        # 這裡我們用一個小技巧，直接呼叫上面的 KD 函數
        # 注意：為了符合框架格式，我們把 Series 轉為 numpy array 傳入
        full_k, full_d = KD(
            pd.Series(self.data.High), 
            pd.Series(self.data.Low), 
            pd.Series(self.data.Close), 
            self.kd_period
        )
        
        # 將計算結果註冊到系統 (這樣畫圖時才會出現)
        self.k = self.I(lambda: full_k, name='K_Line')
        self.d = self.I(lambda: full_d, name='D_Line')

    def next(self):
        # 取得最新的指標數值
        rsi_now = self.rsi[-1]
        
        # 策略邏輯
        
        # --- 買進訊號 ---
        # 條件：RSI 低於 30 (超賣) 且 K線 向上突破 D線 (黃金交叉)
        if rsi_now < self.rsi_lower and crossover(self.k, self.d):
            if not self.position:
                self.buy()

        # --- 賣出訊號 ---
        # 條件：RSI 高於 70 (超買) 或 K線 向下跌破 D線 (死亡交叉)
        # 這裡我們設定：如果有持倉，才檢查是否要賣
        elif self.position:
            if rsi_now > self.rsi_upper or crossover(self.d, self.k):
                self.position.close()

# --- 3. 抓取資料與執行回測 ---

stock_id = "2330.TW" # 台積電
print(f"下載 {stock_id} 資料中...")
df = yf.download(stock_id, start="2021-01-01", end="2023-12-31")

# 資料清理
if isinstance(df.columns, pd.MultiIndex):
    df.columns = df.columns.get_level_values(0)
df = df[['Open', 'High', 'Low', 'Close', 'Volume']]

# 執行回測
bt = Backtest(df, RsiKdStrategy, cash=100_000, commission=.001425)
stats = bt.run()

print("\n=== 回測結果 ===")
print(stats)

# 畫圖
bt.plot()
