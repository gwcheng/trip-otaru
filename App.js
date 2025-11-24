import React, { useState, useEffect } from "react";
import {
  Plane,
  Snowflake,
  Bus,
  Moon,
  Sun,
  MapPin,
  Clock,
  Hotel,
  RefreshCw,
  Info,
  Share2,
  Download,
  X,
} from "lucide-react";

// 雪場座標設定
const RESORTS = [
  { id: "teine", name: "札幌手稻 (Teine)", lat: 43.0982, lon: 141.1969 },
  { id: "hirafu", name: "二世谷 Hirafu", lat: 42.8631, lon: 140.7028 },
  { id: "tengu", name: "小樽天狗山", lat: 43.1786, lon: 140.9814 },
  { id: "onze", name: "Snow Cruise Onze", lat: 43.1444, lon: 141.1447 },
  { id: "asari", name: "朝里川溫泉滑雪場", lat: 43.1539, lon: 141.0319 },
];

// 行程資料 (2025/12/31 - 2026/1/5)
const ITINERARY = [
  {
    day: 1,
    date: "2025/12/31",
    weekday: "週三",
    title: "出發北海道 & 跨年",
    icon: <Plane className="w-5 h-5 text-white" />,
    color: "bg-blue-600",
    details: [
      {
        time: "04:20",
        text: "抵達桃園機場第一航廈 (T1) 報到",
        type: "transport",
      },
      { time: "06:20", text: "起飛：虎航 IT234", type: "transport" },
      { time: "10:55", text: "抵達新千歲機場 (CTS)", type: "transport" },
      {
        time: "12:30",
        text: "搭乘 JR 快速 Airport 前往小樽",
        type: "transport",
      },
      { time: "14:00", text: "小樽市區午餐 / 寄放行李", type: "food" },
      { time: "15:00", text: "Check-in: OMO5 小樽", type: "hotel" },
      { time: "晚上", text: "小樽運河/壽司通跨年晚餐", type: "food" },
    ],
  },
  {
    day: 2,
    date: "2026/1/1",
    weekday: "週四",
    title: "Day 1: 札幌手稻滑雪",
    icon: <Snowflake className="w-5 h-5 text-white" />,
    color: "bg-teal-500",
    details: [
      { time: "08:00", text: "JR 小樽 -> 手稻站 + 巴士", type: "transport" },
      {
        time: "09:30",
        text: "全日滑走：Teine Highland/Olympia",
        type: "activity",
      },
      { time: "12:30", text: "雪場午餐 (恐龍食堂)", type: "food" },
      { time: "16:30", text: "返回小樽", type: "transport" },
    ],
  },
  {
    day: 3,
    date: "2026/1/2",
    weekday: "週五",
    title: "Day 2: 遠征 Niseko Hirafu",
    icon: <Bus className="w-5 h-5 text-white" />,
    color: "bg-indigo-500",
    details: [
      { time: "07:30", text: "OMO5 門口搭乘 Big Run Bus", type: "transport" },
      { time: "10:00", text: "抵達 Hirafu Welcome Center", type: "transport" },
      { time: "10:30", text: "體驗世界級粉雪 / 樹林", type: "activity" },
      { time: "16:00", text: "搭乘巴士返回小樽", type: "transport" },
    ],
  },
  {
    day: 4,
    date: "2026/1/3",
    weekday: "週六",
    title: "Day 3: 天狗山 & Onze 夜滑",
    icon: <Moon className="w-5 h-5 text-white" />,
    color: "bg-purple-600",
    details: [
      { time: "09:30", text: "巴士前往小樽天狗山", type: "transport" },
      { time: "10:00", text: "天狗山滑行 + 眺望港口", type: "activity" },
      { time: "13:00", text: "小樽市區/堺町通午餐", type: "food" },
      { time: "15:30", text: "移動至 Snow Cruise Onze", type: "transport" },
      { time: "16:30", text: "Onze 海景夕陽滑行至夜滑", type: "activity" },
    ],
  },
  {
    day: 5,
    date: "2026/1/4",
    weekday: "週日",
    title: "Day 4: 朝里川溫泉滑雪",
    icon: <Sun className="w-5 h-5 text-white" />,
    color: "bg-orange-500",
    details: [
      { time: "09:00", text: "巴士前往朝里川溫泉滑雪場", type: "transport" },
      { time: "全日", text: "享受寬廣雪道", type: "activity" },
      { time: "15:00", text: "體驗日歸溫泉 (可選)", type: "activity" },
      { time: "17:00", text: "返回飯店打包", type: "hotel" },
    ],
  },
  {
    day: 6,
    date: "2026/1/5",
    weekday: "週一",
    title: "返程",
    icon: <Plane className="w-5 h-5 text-white" />,
    color: "bg-slate-700",
    details: [
      { time: "07:30", text: "Check-out & JR 前往新千歲", type: "transport" },
      { time: "09:00", text: "抵達機場 / 國內線採買伴手禮", type: "food" },
      { time: "09:55", text: "前往國際線櫃台報到", type: "transport" },
      { time: "11:55", text: "起飛：虎航 IT235", type: "transport" },
      { time: "15:35", text: "抵達桃園機場 T1", type: "transport" },
    ],
  },
];

export default function SkiTripApp() {
  const [activeTab, setActiveTab] = useState("itinerary");
  const [weatherData, setWeatherData] = useState({});
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showInstallModal, setShowInstallModal] = useState(false);

  const TARGET_DATE = "2025-12-31T06:20:00";

  const calculateTimeLeft = () => {
    const difference = +new Date(TARGET_DATE) - +new Date();
    let timeLeft = { days: 0, hours: 0, minutes: 0 };

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  const fetchWeather = async () => {
    setLoading(true);
    const newData = {};

    try {
      await Promise.all(
        RESORTS.map(async (resort) => {
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${resort.lat}&longitude=${resort.lon}&daily=temperature_2m_max,temperature_2m_min,snowfall_sum,windspeed_10m_max&timezone=Asia%2FTokyo&forecast_days=5`;
          const response = await fetch(url);
          const data = await response.json();
          if (data.daily) newData[resort.id] = data.daily;
        })
      );
      setWeatherData(newData);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Failed to fetch weather", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: "SnowTrip 2026",
          text: "我們的北海道滑雪行程表",
          url: window.location.href,
        })
        .catch(console.error);
    } else {
      setShowInstallModal(true);
    }
  };

  const renderWeatherCard = (resort) => {
    const data = weatherData[resort.id];
    if (!data) return null;

    return (
      <div
        key={resort.id}
        className="bg-white rounded-xl shadow-md overflow-hidden mb-4 border border-slate-100"
      >
        <div className="bg-slate-50 p-3 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-500" />
            {resort.name}
          </h3>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            {resort.id === "teine" && (
              <span className="bg-yellow-100 text-yellow-700 px-1 rounded">
                Day 1
              </span>
            )}
            {resort.id === "hirafu" && (
              <span className="bg-indigo-100 text-indigo-700 px-1 rounded">
                Day 2
              </span>
            )}
            {resort.id === "tengu" && (
              <span className="bg-purple-100 text-purple-700 px-1 rounded">
                Day 3
              </span>
            )}
            {resort.id === "asari" && (
              <span className="bg-orange-100 text-orange-700 px-1 rounded">
                Day 4
              </span>
            )}
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-5 gap-1 text-center divide-x divide-slate-100">
            {data.time.map((date, index) => {
              const dateObj = new Date(date);
              const dayLabel = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
              const snow = data.snowfall_sum[index];
              const maxTemp = data.temperature_2m_max[index];
              const minTemp = data.temperature_2m_min[index];

              let snowColor = "text-slate-300";
              if (snow > 0) snowColor = "text-blue-400";
              if (snow > 10) snowColor = "text-blue-600 font-bold";
              if (snow > 30) snowColor = "text-indigo-600 font-extrabold";

              return (
                <div key={index} className="flex flex-col items-center px-1">
                  <span className="text-[10px] text-slate-500 mb-1 font-medium">
                    {dayLabel}
                  </span>
                  <div className="flex flex-col items-center mb-1 h-10 justify-center">
                    <Snowflake className={`w-4 h-4 ${snowColor}`} />
                    <span className={`text-[10px] mt-0.5 ${snowColor}`}>
                      {snow}cm
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-600 flex flex-col">
                    <span className="text-red-400">{Math.round(maxTemp)}°</span>
                    <span className="text-blue-400">
                      {Math.round(minTemp)}°
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
      {/* Install Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl relative">
            <button
              onClick={() => setShowInstallModal(false)}
              className="absolute top-3 right-3 p-1 bg-slate-100 rounded-full hover:bg-slate-200"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Download className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                讓朋友一起使用！
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                將此網頁傳給朋友，並請他們按照以下步驟加入手機主畫面：
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <h4 className="font-bold text-slate-700 text-sm mb-1 flex items-center gap-2">
                  <span className="w-4 h-4 bg-black text-white rounded-full flex items-center justify-center text-[10px]">
                    i
                  </span>
                  iPhone (iOS)
                </h4>
                <p className="text-xs text-slate-600">
                  點擊下方 Safari 的分享按鈕{" "}
                  <Share2 className="w-3 h-3 inline mx-0.5" /> <br />
                  往下滑找到 <strong>「加入主畫面」</strong>
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <h4 className="font-bold text-slate-700 text-sm mb-1 flex items-center gap-2">
                  <span className="w-4 h-4 bg-green-600 text-white rounded-full flex items-center justify-center text-[10px]">
                    A
                  </span>
                  Android
                </h4>
                <p className="text-xs text-slate-600">
                  點擊右上角選單 (⋮) <br />
                  選擇 <strong>「安裝應用程式」</strong> 或{" "}
                  <strong>「加到主畫面」</strong>
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowInstallModal(false)}
              className="w-full mt-6 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
            >
              知道了
            </button>
          </div>
        </div>
      )}

      {/* Header Area with Otaru Snow Image */}
      <div className="relative bg-slate-900 text-white p-6 pb-16 shadow-lg overflow-hidden">
        {/* Background Image Layer */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1548588627-f978862b85e1?q=80&w=1920&auto=format&fit=crop"
            alt="Otaru Snow"
            className="w-full h-full object-cover opacity-70"
          />
          {/* Dark Gradient Overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-slate-900/10"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/50 to-blue-900/50 mix-blend-overlay"></div>
        </div>

        {/* Content Layer (z-10) */}
        <div className="max-w-md mx-auto relative z-10">
          <div className="flex justify-between items-start">
            <div className="drop-shadow-md">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                SnowTrip 2026
              </h1>
              <p className="text-blue-50 text-xs mt-1 font-medium bg-white/20 backdrop-blur-sm inline-block px-2 py-0.5 rounded-full border border-white/10">
                2025/12/31 - 2026/1/5
              </p>
            </div>
            <button
              onClick={handleShare}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-full backdrop-blur-md transition-colors border border-white/10 shadow-lg"
              title="分享給朋友"
            >
              <Share2 className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="mt-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="bg-amber-400/20 p-2 rounded-full border border-amber-400/30">
                <Plane className="w-5 h-5 text-amber-300 transform -rotate-45" />
              </div>
              <div>
                <p className="text-[10px] text-blue-100 uppercase tracking-wide">
                  Next Flight
                </p>
                <p className="text-sm font-bold text-white shadow-black drop-shadow-sm">
                  IT234{" "}
                  <span className="font-normal text-blue-100 mx-1">to</span> CTS
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-white font-mono font-bold">
                {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m
              </p>
              <p className="text-[10px] text-blue-100">Dec 31, 06:20</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto -mt-8 px-4 relative z-20">
        {/* Navigation */}
        <div className="bg-white rounded-xl shadow-lg p-1.5 flex mb-5 border border-slate-100">
          {["itinerary", "snow", "info"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-1 ${
                activeTab === tab
                  ? "bg-slate-800 text-white shadow-md transform scale-100"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              {tab === "itinerary" && <Clock className="w-3.5 h-3.5" />}
              {tab === "snow" && <Snowflake className="w-3.5 h-3.5" />}
              {tab === "info" && <Info className="w-3.5 h-3.5" />}
              {tab === "itinerary" ? "行程" : tab === "snow" ? "雪況" : "資訊"}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "itinerary" && (
          <div className="space-y-4 animate-fade-in">
            {ITINERARY.map((item, index) => (
              <div
                key={item.day}
                className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden group"
              >
                <div
                  className={`p-3 flex items-center justify-between ${item.color} text-white`}
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 w-8 h-8 rounded-lg flex items-center justify-center font-bold shadow-inner">
                      {item.day}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">{item.title}</h3>
                      <p className="text-[10px] opacity-80 font-mono tracking-wide">
                        {item.date} • {item.weekday}
                      </p>
                    </div>
                  </div>
                  {item.icon}
                </div>
                <div className="p-4 bg-white relative">
                  <div className="absolute top-0 bottom-0 left-[27px] w-0.5 bg-slate-100 z-0"></div>
                  <div className="space-y-5 relative z-10">
                    {item.details.map((detail, idx) => (
                      <div key={idx} className="flex gap-3 items-start">
                        <div
                          className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ring-4 ring-white ${
                            detail.type === "transport"
                              ? "bg-slate-400"
                              : detail.type === "activity"
                              ? "bg-blue-500"
                              : detail.type === "hotel"
                              ? "bg-purple-500"
                              : "bg-amber-400"
                          }`}
                        ></div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            {detail.time}
                          </span>
                          <p className="text-sm text-slate-700 mt-1 font-medium leading-relaxed">
                            {detail.text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "snow" && (
          <div className="space-y-3 animate-fade-in">
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wider pl-1">
                Live Conditions
              </h2>
              <button
                onClick={fetchWeather}
                disabled={loading}
                className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors"
              >
                <RefreshCw
                  className={`w-3 h-3 ${loading ? "animate-spin" : ""}`}
                />
                {loading ? "Updating..." : "Update Now"}
              </button>
            </div>

            {loading && Object.keys(weatherData).length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-300" />
                <span className="text-xs">Connecting to Open-Meteo...</span>
              </div>
            ) : (
              <>
                {RESORTS.map((resort) => renderWeatherCard(resort))}
                <p className="text-[10px] text-center text-slate-400 mt-4">
                  *顯示即時預報，供出發前觀察天氣模式使用
                </p>
              </>
            )}
          </div>
        )}

        {activeTab === "info" && (
          <div className="space-y-5 animate-fade-in">
            {/* Flight Ticket Style */}
            <div className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-slate-800"></div>
              <div className="p-4">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                  <Plane className="w-4 h-4 text-amber-500" />
                  Tigerair Taiwan
                </h3>

                {/* Outbound */}
                <div className="mb-6 relative">
                  <div className="flex justify-between items-end mb-1">
                    <div>
                      <div className="text-3xl font-black text-slate-800">
                        TPE
                      </div>
                      <div className="text-[10px] text-slate-500 bg-slate-100 px-1 rounded inline-block">
                        Term 1
                      </div>
                    </div>
                    <div className="flex-1 px-4 text-center">
                      <div className="text-[10px] text-slate-400 mb-1">
                        3h 35m
                      </div>
                      <div className="flex items-center gap-2 opacity-30">
                        <div className="h-px bg-slate-800 flex-1"></div>
                        <Plane className="w-3 h-3 rotate-90 text-slate-800" />
                        <div className="h-px bg-slate-800 flex-1"></div>
                      </div>
                      <div className="text-xs font-bold text-slate-700 mt-1">
                        IT 234
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-black text-slate-800">
                        CTS
                      </div>
                      <div className="text-[10px] text-slate-500">Sapporo</div>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs font-medium text-slate-600">
                    <span>12/31 06:20</span>
                    <span>12/31 10:55</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-slate-200 my-4 -mx-4"></div>

                {/* Inbound */}
                <div>
                  <div className="flex justify-between items-end mb-1">
                    <div>
                      <div className="text-3xl font-black text-slate-800">
                        CTS
                      </div>
                      <div className="text-[10px] text-slate-500">Sapporo</div>
                    </div>
                    <div className="flex-1 px-4 text-center">
                      <div className="text-[10px] text-slate-400 mb-1">
                        4h 40m
                      </div>
                      <div className="flex items-center gap-2 opacity-30">
                        <div className="h-px bg-slate-800 flex-1"></div>
                        <Plane className="w-3 h-3 rotate-90 text-slate-800" />
                        <div className="h-px bg-slate-800 flex-1"></div>
                      </div>
                      <div className="text-xs font-bold text-slate-700 mt-1">
                        IT 235
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-black text-slate-800">
                        TPE
                      </div>
                      <div className="text-[10px] text-slate-500 bg-slate-100 px-1 rounded inline-block">
                        Term 1
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs font-medium text-slate-600">
                    <span>01/05 11:55</span>
                    <span>01/05 15:35</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Hotel Info */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-100">
              <div className="h-28 bg-slate-800 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent z-10"></div>
                <img
                  src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                  alt="Hotel"
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute bottom-3 left-4 z-20 text-white">
                  <h3 className="font-bold flex items-center gap-2">
                    <Hotel className="w-4 h-4" />
                    OMO5 Otaru
                  </h3>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <span className="text-slate-600">北海道小樽市色內1-6-31</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <span className="text-slate-600">
                    Check-in: 15:00 | Out: 11:00
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-600 mt-2">
                  <span className="font-bold text-slate-700 block mb-1">
                    交通提示
                  </span>
                  抵達新千歲 (10:55) 後，建議搭乘 12:06 或 12:30 的快速 Airport
                  列車直達小樽，車程約 75 分鐘。
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
