import yfinance as yf
import pandas as pd
from backtesting import Backtest, Strategy
from backtesting.lib import crossover

# --- 第一部分：定義指標計算函數 ---

def RSI(series, period=14):
    """計算 RSI 相對強弱指標 (使用 Wilder's Smoothing)"""
    delta = series.diff()
    gain = (delta.where(delta > 0, 0)).fillna(0)
    loss = (-delta.where(delta < 0, 0)).fillna(0)
    
    avg_gain = gain.ewm(com=period-1, min_periods=period).mean()
    avg_loss = loss.ewm(com=period-1, min_periods=period).mean()
    
    rs = avg_gain / avg_loss
    return 100 - (100 / (1 + rs))

def KD(high, low, close, n=9):
    """計算 KD 指標，回傳 K 與 D 兩個序列"""
    # 1. 計算 RSV
    lowest_low = low.rolling(n).min()
    highest_high = high.rolling(n).max()
    rsv = (close - lowest_low) / (highest_high - lowest_low) * 100
    
    # 2. 計算 K 與 D (權重 1/3)
    k = rsv.ewm(alpha=1/3, adjust=False).mean()
    d = k.ewm(alpha=1/3, adjust=False).mean()
    return k, d

# --- 第二部分：定義交易策略 ---

class RsiKdStrategy(Strategy):
    # 參數設定
    rsi_period = 14
    kd_period = 9
    rsi_lower = 30  # 超賣區 (買進門檻)
    rsi_upper = 70  # 超買區 (賣出門檻)

    def init(self):
        # 準備指標資料
        # 注意：為了讓圖表畫出 K 和 D，我們用 self.I 包裝
        self.rsi = self.I(RSI, pd.Series(self.data.Close), self.rsi_period)
        
        # 計算 KD 並拆解成 K 和 D
        full_k, full_d = KD(
            pd.Series(self.data.High), 
            pd.Series(self.data.Low), 
            pd.Series(self.data.Close), 
            self.kd_period
        )
        self.k = self.I(lambda: full_k, name='K_Line')
        self.d = self.I(lambda: full_d, name='D_Line')

    def next(self):
        # 取得最新一根 K 棒的指標數值
        rsi_now = self.rsi[-1]
        
        # --- 進場邏輯 ---
        # 條件：RSI < 30 (恐慌) 且 K 向上突破 D (轉強)
        if rsi_now < self.rsi_lower and crossover(self.k, self.d):
            if not self.position: # 如果目前空手才買
                self.buy()

        # --- 出場邏輯 ---
        # 條件：RSI > 70 (過熱) 或 K 向下跌破 D (轉弱)
        elif self.position: # 如果目前有持倉才賣
            if rsi_now > self.rsi_upper or crossover(self.d, self.k):
                self.position.close() # 平倉賣出

# --- 第三部分：抓取資料與執行回測 ---

if __name__ == '__main__':
    # 1. 下載資料 (台積電)
    stock_id = "2330.TW"
    start_date = "2025-01-01"
    end_date = "2026-01-01" # 設為隔年1/1以確保包含12/31
    
    print(f"正在下載 {stock_id} 資料 ({start_date} ~ {end_date})...")
    df = yf.download(stock_id, start=start_date, end=end_date)

    # 資料清理 (處理 yfinance 多層索引問題)
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)
    
    # 確保有需要的欄位
    df = df[['Open', 'High', 'Low', 'Close', 'Volume']]
    
    # 檢查是否下載到資料
    if df.empty:
        print("錯誤：沒有下載到資料，請檢查日期或網路連線。")
    else:
        # 2. 設定回測
        bt = Backtest(
            df, 
            RsiKdStrategy, 
            cash=100000,        # 本金 10 萬
            commission=.001425, # 手續費 0.1425%
            trade_on_close=True # 以收盤價成交
        )

        # 3. 執行並印出結果
        stats = bt.run()
        
        print("\n" + "="*30)
        print(f"股票代號: {stock_id}")
        print(f"回測區間: {start_date} ~ {end_date}")
        print("-" * 30)
        print(f"初始資金: {100000:,.0f}")
        print(f"最終資產: {stats['Equity Final [$]']:,.0f}")
        print(f"淨損益  : {stats['Equity Final [$]'] - 100000:,.0f}")
        print(f"報酬率  : {stats['Return [%]']:.2f}%")
        print(f"交易次數: {stats['# Trades']}")
        print(f"勝率    : {stats['Win Rate [%]']:.2f}%")
        print("="*30)

        # 4. 畫圖 (會在瀏覽器跳出互動視窗)
        bt.plot()
