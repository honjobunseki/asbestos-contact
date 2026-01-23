import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Bindings } from './types'

const app = new Hono<{ Bindings: Bindings }>()

// CORS設定（API用）
app.use('/api/*', cors())

// 管理画面
app.get('/admin', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>検索ログ管理 - アスベスト通報システム</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-100 min-h-screen">
        <div class="container mx-auto px-4 py-8 max-w-6xl">
            <!-- ヘッダー -->
            <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
                <div class="flex justify-between items-center">
                    <div>
                        <h1 class="text-3xl font-bold text-gray-800 mb-2">
                            <i class="fas fa-chart-bar text-blue-500 mr-2"></i>
                            検索ログ管理
                        </h1>
                        <p class="text-gray-600">Perplexity API検索の成功/失敗を確認できます</p>
                    </div>
                    <a href="/" class="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition">
                        <i class="fas fa-home mr-2"></i>
                        ホームに戻る
                    </a>
                </div>
            </div>

            <!-- 統計情報 -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div class="bg-white rounded-lg shadow-md p-6">
                    <div class="text-gray-600 text-sm mb-1">総検索数</div>
                    <div id="totalCount" class="text-3xl font-bold text-blue-600">-</div>
                </div>
                <div class="bg-white rounded-lg shadow-md p-6">
                    <div class="text-gray-600 text-sm mb-1">成功（手動DB）</div>
                    <div id="manualCount" class="text-3xl font-bold text-green-600">-</div>
                </div>
                <div class="bg-white rounded-lg shadow-md p-6">
                    <div class="text-gray-600 text-sm mb-1">成功（API）</div>
                    <div id="apiSuccessCount" class="text-3xl font-bold text-blue-600">-</div>
                </div>
                <div class="bg-white rounded-lg shadow-md p-6">
                    <div class="text-gray-600 text-sm mb-1">失敗</div>
                    <div id="failedCount" class="text-3xl font-bold text-red-600">-</div>
                </div>
            </div>

            <!-- フィルター -->
            <div class="bg-white rounded-lg shadow-md p-6 mb-6">
                <div class="flex gap-4 items-center flex-wrap">
                    <div>
                        <label class="block text-gray-700 font-semibold mb-2">フィルター</label>
                        <select id="filterType" class="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none">
                            <option value="all">すべて</option>
                            <option value="manual">手動DB</option>
                            <option value="api-success">API成功</option>
                            <option value="api-failed">API失敗</option>
                            <option value="incomplete">情報不完全（電話/メール/フォームなし）</option>
                        </select>
                    </div>
                    <div class="mt-auto">
                        <button id="clearLogsBtn" class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition">
                            <i class="fas fa-trash mr-2"></i>
                            ログをクリア
                        </button>
                    </div>
                    <div class="mt-auto">
                        <button id="exportBtn" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition">
                            <i class="fas fa-download mr-2"></i>
                            JSONエクスポート
                        </button>
                    </div>
                </div>
            </div>

            <!-- ログテーブル -->
            <div class="bg-white rounded-lg shadow-md p-6">
                <h2 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-list mr-2"></i>
                    検索ログ一覧
                </h2>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">市町村名</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ソース</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">電話</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">メール</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">フォーム</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">検索日時</th>
                            </tr>
                        </thead>
                        <tbody id="logsTableBody" class="bg-white divide-y divide-gray-200">
                            <tr>
                                <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                                    ログを読み込み中...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            let allLogs = [];

            async function loadLogs() {
                try {
                    const response = await axios.get('/api/search-logs');
                    allLogs = response.data;
                    updateStats();
                    renderLogs();
                } catch (error) {
                    console.error('Error loading logs:', error);
                    alert('ログの読み込みに失敗しました');
                }
            }

            function updateStats() {
                const total = allLogs.length;
                const manual = allLogs.filter(log => log.source === 'manual').length;
                const apiSuccess = allLogs.filter(log => log.source === 'api' && log.success).length;
                const failed = allLogs.filter(log => !log.success).length;

                document.getElementById('totalCount').textContent = total;
                document.getElementById('manualCount').textContent = manual;
                document.getElementById('apiSuccessCount').textContent = apiSuccess;
                document.getElementById('failedCount').textContent = failed;
            }

            function renderLogs() {
                const filterType = document.getElementById('filterType').value;
                let filteredLogs = allLogs;

                // フィルタリング
                if (filterType === 'manual') {
                    filteredLogs = allLogs.filter(log => log.source === 'manual');
                } else if (filterType === 'api-success') {
                    filteredLogs = allLogs.filter(log => log.source === 'api' && log.success);
                } else if (filterType === 'api-failed') {
                    filteredLogs = allLogs.filter(log => !log.success);
                } else if (filterType === 'incomplete') {
                    filteredLogs = allLogs.filter(log => !log.hasPhone || !log.hasEmail || !log.hasFormUrl);
                }

                const tbody = document.getElementById('logsTableBody');
                
                if (filteredLogs.length === 0) {
                    tbody.innerHTML = \`
                        <tr>
                            <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                                ログがありません
                            </td>
                        </tr>
                    \`;
                    return;
                }

                tbody.innerHTML = filteredLogs.map(log => \`
                    <tr class="\${!log.success ? 'bg-red-50' : ''}">
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm font-medium text-gray-900">\${log.city}</div>
                            \${log.error ? \`<div class="text-xs text-red-600">\${log.error}</div>\` : ''}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full \${log.source === 'manual' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}">
                                \${log.source === 'manual' ? '手動DB' : 'API'}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full \${log.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                \${log.success ? '成功' : '失敗'}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-center">
                            \${log.hasPhone ? '<i class="fas fa-check text-green-600"></i>' : '<i class="fas fa-times text-red-600"></i>'}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-center">
                            \${log.hasEmail ? '<i class="fas fa-check text-green-600"></i>' : '<i class="fas fa-times text-red-600"></i>'}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-center">
                            \${log.hasFormUrl ? '<i class="fas fa-check text-green-600"></i>' : '<i class="fas fa-times text-red-600"></i>'}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            \${new Date(log.timestamp).toLocaleString('ja-JP')}
                        </td>
                    </tr>
                \`).join('');
            }

            async function clearLogs() {
                if (!confirm('すべてのログをクリアしますか？')) {
                    return;
                }
                
                try {
                    await axios.delete('/api/search-logs');
                    allLogs = [];
                    updateStats();
                    renderLogs();
                    alert('ログをクリアしました');
                } catch (error) {
                    console.error('Error clearing logs:', error);
                    alert('ログのクリアに失敗しました');
                }
            }

            function exportLogs() {
                const filterType = document.getElementById('filterType').value;
                let filteredLogs = allLogs;

                // フィルタリング（exportボタン用）
                if (filterType === 'api-failed') {
                    filteredLogs = allLogs.filter(log => !log.success);
                } else if (filterType === 'incomplete') {
                    filteredLogs = allLogs.filter(log => !log.hasPhone || !log.hasEmail || !log.hasFormUrl);
                }

                const dataStr = JSON.stringify(filteredLogs, null, 2);
                const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                
                const exportFileDefaultName = \`search-logs-\${new Date().toISOString().split('T')[0]}.json\`;
                
                const linkElement = document.createElement('a');
                linkElement.setAttribute('href', dataUri);
                linkElement.setAttribute('download', exportFileDefaultName);
                linkElement.click();
            }

            // イベントリスナー
            document.getElementById('filterType').addEventListener('change', renderLogs);
            document.getElementById('clearLogsBtn').addEventListener('click', clearLogs);
            document.getElementById('exportBtn').addEventListener('click', exportLogs);

            // 初期ロード
            loadLogs();

            // 自動更新（30秒ごと）
            setInterval(loadLogs, 30000);
        </script>
    </body>
    </html>
  `)
})

// メインページ
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>アスベスト通報サイト</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
        <div class="container mx-auto px-4 py-8 max-w-3xl">
            <!-- ヘッダー -->
            <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
                <div class="flex justify-between items-center">
                    <div>
                        <h1 class="text-3xl font-bold text-gray-800 mb-2">
                            <i class="fas fa-exclamation-triangle text-yellow-500 mr-2"></i>
                            アスベスト通報システム
                        </h1>
                        <p class="text-gray-600">お住まいの地域のアスベスト情報を通報できます</p>
                    </div>
                    <a href="/admin" class="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition text-sm">
                        <i class="fas fa-cog mr-2"></i>
                        管理画面
                    </a>
                </div>
            </div>

            <!-- メインフォーム -->
            <div class="bg-white rounded-lg shadow-lg p-6">
                <form id="asbestosForm">
                    <!-- 2カラムレイアウト -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <!-- 左カラム: 簡単検索 -->
                        <div class="border-r border-gray-200 pr-6">
                            <h3 class="text-lg font-bold text-gray-800 mb-4">
                                <i class="fas fa-search text-blue-500 mr-2"></i>
                                簡単検索
                            </h3>
                            <div class="mb-4">
                                <label class="block text-gray-700 font-semibold mb-2">
                                    市区町村名を入力
                                </label>
                                <input 
                                    type="text" 
                                    id="citySearchInput"
                                    placeholder="例: 本庄、渋谷、横浜"
                                    class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition"
                                    autocomplete="off"
                                >
                                <p class="text-sm text-gray-500 mt-1">入力すると候補が表示されます</p>
                                
                                <!-- 候補リスト -->
                                <div id="suggestions" class="mt-2 bg-white border border-gray-300 rounded-lg shadow-lg hidden max-h-60 overflow-y-auto">
                                    <!-- 候補がここに表示される -->
                                </div>
                            </div>
                        </div>

                        <!-- 右カラム: プルダウン選択 -->
                        <div class="pl-6">
                            <h3 class="text-lg font-bold text-gray-800 mb-4">
                                <i class="fas fa-list text-green-500 mr-2"></i>
                                プルダウン選択
                            </h3>
                            <div class="mb-4">
                                <label class="block text-gray-700 font-semibold mb-2">
                                    都道府県を選択
                                </label>
                                <select 
                                    id="prefectureSelect"
                                    class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition"
                                >
                                    <option value="">選択してください</option>
                                    <!-- 都道府県リストはJavaScriptで追加 -->
                                </select>
                            </div>

                            <div class="mb-4">
                                <label class="block text-gray-700 font-semibold mb-2">
                                    市区町村を選択
                                </label>
                                <select 
                                    id="citySelect"
                                    class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition"
                                    disabled
                                >
                                    <option value="">まず都道府県を選択</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- 問い合わせ内容選択 -->
                    <div class="mt-6 pt-6 border-t border-gray-300">
                        <h3 class="text-lg font-bold text-gray-800 mb-4">
                            <i class="fas fa-question-circle text-orange-500 mr-2"></i>
                            問い合わせ内容
                        </h3>
                        
                        <div class="mb-4">
                            <label class="block text-gray-700 font-semibold mb-2">
                                問い合わせの目的を選択してください
                            </label>
                            <select 
                                id="inquiryType"
                                class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition"
                            >
                                <option value="">選択してください</option>
                                <option value="survey">事前調査・届出の不正（環境部局）</option>
                                <option value="prevention">飛散防止が不十分（環境部局）</option>
                                <option value="safety">作業員の安全（労働基準監督署）</option>
                                <option value="waste">廃棄物処理の不正（廃棄物部局）</option>
                                <option value="health">健康被害・不安（保健部局／労基署）</option>
                            </select>
                            <p class="text-sm text-gray-500 mt-2">
                                <i class="fas fa-info-circle mr-1"></i>
                                目的に応じて適切な連絡先が表示されます
                            </p>
                        </div>

                        <div class="mb-4">
                            <label class="block text-gray-700 font-semibold mb-2">
                                問い合わせ内容の詳細（任意）
                            </label>
                            <textarea 
                                id="inquiryDetail"
                                rows="3"
                                placeholder="具体的な問い合わせ内容を入力してください（任意）"
                                class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition resize-none"
                            ></textarea>
                        </div>
                    </div>
                </form>

                <!-- 検索履歴タブ -->
                <div id="historyTabs" class="mt-6 hidden">
                    <div class="border-b border-gray-300">
                        <div id="tabButtons" class="flex overflow-x-auto space-x-2 pb-2">
                            <!-- タブボタンがここに表示される -->
                        </div>
                    </div>
                </div>

                <!-- 結果表示エリア -->
                <div id="resultArea" class="mt-6 hidden">
                    <div id="resultContent">
                        <!-- 結果がここに表示される -->
                    </div>
                </div>

                <!-- ローディング表示 -->
                <div id="loading" class="mt-6 hidden text-center">
                    <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p class="text-gray-600 mt-2">検索中...</p>
                </div>
            </div>

            <!-- フッター -->
            <div class="text-center mt-6 text-gray-600 text-sm">
                <p>このサイトは情報提供を目的としています</p>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            // 全国の都道府県・市区町村データ（完全版）
            const citiesData = {
              "北海道": ["札幌市", "函館市", "小樽市", "旭川市", "室蘭市", "釧路市", "帯広市", "北見市", "夕張市", "岩見沢市"],
              "青森県": ["青森市", "弘前市", "八戸市", "黒石市", "五所川原市", "十和田市", "三沢市", "むつ市"],
              "岩手県": ["盛岡市", "宮古市", "大船渡市", "花巻市", "北上市", "久慈市", "遠野市", "一関市", "陸前高田市"],
              "宮城県": ["仙台市", "石巻市", "塩竈市", "気仙沼市", "白石市", "名取市", "角田市", "多賀城市", "岩沼市"],
              "秋田県": ["秋田市", "能代市", "横手市", "大館市", "男鹿市", "湯沢市", "鹿角市", "由利本荘市"],
              "山形県": ["山形市", "米沢市", "鶴岡市", "酒田市", "新庄市", "寒河江市", "上山市", "村山市", "長井市"],
              "福島県": ["福島市", "会津若松市", "郡山市", "いわき市", "白河市", "須賀川市", "喜多方市", "相馬市"],
              "茨城県": ["水戸市", "日立市", "土浦市", "古河市", "石岡市", "結城市", "龍ケ崎市", "下妻市", "常総市", "つくば市"],
              "栃木県": ["宇都宮市", "足利市", "栃木市", "佐野市", "鹿沼市", "日光市", "小山市", "真岡市", "大田原市"],
              "群馬県": ["前橋市", "高崎市", "桐生市", "伊勢崎市", "太田市", "沼田市", "館林市", "渋川市", "藤岡市"],
              "埼玉県": ["さいたま市", "川越市", "熊谷市", "川口市", "行田市", "秩父市", "所沢市", "飯能市", "加須市", "本庄市", "東松山市", "春日部市", "狭山市", "羽生市", "鴻巣市", "深谷市", "上尾市", "草加市", "越谷市", "蕨市", "戸田市", "入間市", "朝霞市", "志木市", "和光市", "新座市", "桶川市", "久喜市", "北本市", "八潮市", "富士見市", "三郷市", "蓮田市", "坂戸市", "幸手市", "鶴ヶ島市", "日高市", "吉川市", "ふじみ野市", "白岡市"],
              "千葉県": ["千葉市", "銚子市", "市川市", "船橋市", "館山市", "木更津市", "松戸市", "野田市", "茂原市", "成田市", "佐倉市", "東金市", "旭市", "習志野市", "柏市", "勝浦市", "市原市", "流山市", "八千代市", "我孫子市", "鴨川市", "鎌ケ谷市", "君津市", "富津市", "浦安市", "四街道市", "袖ケ浦市", "八街市", "印西市", "白井市", "富里市", "南房総市", "匝瑳市", "香取市", "山武市", "いすみ市", "大網白里市"],
              "東京都": ["千代田区", "中央区", "港区", "新宿区", "文京区", "台東区", "墨田区", "江東区", "品川区", "目黒区", "大田区", "世田谷区", "渋谷区", "中野区", "杉並区", "豊島区", "北区", "荒川区", "板橋区", "練馬区", "足立区", "葛飾区", "江戸川区", "八王子市", "立川市", "武蔵野市", "三鷹市", "青梅市", "府中市", "昭島市", "調布市", "町田市", "小金井市", "小平市", "日野市", "東村山市", "国分寺市", "国立市", "福生市", "狛江市", "東大和市", "清瀬市", "東久留米市", "武蔵村山市", "多摩市", "稲城市", "羽村市", "あきる野市", "西東京市"],
              "神奈川県": ["横浜市", "川崎市", "相模原市", "横須賀市", "平塚市", "鎌倉市", "藤沢市", "小田原市", "茅ヶ崎市", "逗子市", "三浦市", "秦野市", "厚木市", "大和市", "伊勢原市", "海老名市", "座間市", "南足柄市", "綾瀬市"],
              "新潟県": ["新潟市", "長岡市", "三条市", "柏崎市", "新発田市", "小千谷市", "加茂市", "十日町市", "見附市", "村上市", "燕市", "糸魚川市", "妙高市", "五泉市", "上越市", "阿賀野市", "佐渡市", "魚沼市", "南魚沼市", "胎内市"],
              "富山県": ["富山市", "高岡市", "魚津市", "氷見市", "滑川市", "黒部市", "砺波市", "小矢部市", "南砺市", "射水市"],
              "石川県": ["金沢市", "七尾市", "小松市", "輪島市", "珠洲市", "加賀市", "羽咋市", "かほく市", "白山市", "能美市", "野々市市"],
              "福井県": ["福井市", "敦賀市", "小浜市", "大野市", "勝山市", "鯖江市", "あわら市", "越前市", "坂井市"],
              "山梨県": ["甲府市", "富士吉田市", "都留市", "山梨市", "大月市", "韮崎市", "南アルプス市", "北杜市", "甲斐市", "笛吹市", "上野原市", "甲州市", "中央市"],
              "長野県": ["長野市", "松本市", "上田市", "岡谷市", "飯田市", "諏訪市", "須坂市", "小諸市", "伊那市", "駒ヶ根市", "中野市", "大町市", "飯山市", "茅野市", "塩尻市", "佐久市", "千曲市", "東御市", "安曇野市"],
              "岐阜県": ["岐阜市", "大垣市", "高山市", "多治見市", "関市", "中津川市", "美濃市", "瑞浪市", "羽島市", "恵那市", "美濃加茂市", "土岐市", "各務原市", "可児市", "山県市", "瑞穂市", "飛騨市", "本巣市", "郡上市", "下呂市", "海津市"],
              "静岡県": ["静岡市", "浜松市", "沼津市", "熱海市", "三島市", "富士宮市", "伊東市", "島田市", "富士市", "磐田市", "焼津市", "掛川市", "藤枝市", "御殿場市", "袋井市", "下田市", "裾野市", "湖西市", "伊豆市", "御前崎市", "菊川市", "伊豆の国市", "牧之原市"],
              "愛知県": ["名古屋市", "豊橋市", "岡崎市", "一宮市", "瀬戸市", "半田市", "春日井市", "豊川市", "津島市", "碧南市", "刈谷市", "豊田市", "安城市", "西尾市", "蒲郡市", "犬山市", "常滑市", "江南市", "小牧市", "稲沢市", "新城市", "東海市", "大府市", "知多市", "知立市", "尾張旭市", "高浜市", "岩倉市", "豊明市", "日進市", "田原市", "愛西市", "清須市", "北名古屋市", "弥富市", "みよし市", "あま市", "長久手市"],
              "三重県": ["津市", "四日市市", "伊勢市", "松阪市", "桑名市", "鈴鹿市", "名張市", "尾鷲市", "亀山市", "鳥羽市", "熊野市", "いなべ市", "志摩市", "伊賀市"],
              "滋賀県": ["大津市", "彦根市", "長浜市", "近江八幡市", "草津市", "守山市", "栗東市", "甲賀市", "野洲市", "湖南市", "高島市", "東近江市", "米原市"],
              "京都府": ["京都市", "福知山市", "舞鶴市", "綾部市", "宇治市", "宮津市", "亀岡市", "城陽市", "向日市", "長岡京市", "八幡市", "京田辺市", "京丹後市", "南丹市", "木津川市"],
              "大阪府": ["大阪市", "堺市", "岸和田市", "豊中市", "池田市", "吹田市", "泉大津市", "高槻市", "貝塚市", "守口市", "枚方市", "茨木市", "八尾市", "泉佐野市", "富田林市", "寝屋川市", "河内長野市", "松原市", "大東市", "和泉市", "箕面市", "柏原市", "羽曳野市", "門真市", "摂津市", "高石市", "藤井寺市", "東大阪市", "泉南市", "四條畷市", "交野市", "大阪狭山市", "阪南市"],
              "兵庫県": ["神戸市", "姫路市", "尼崎市", "明石市", "西宮市", "洲本市", "芦屋市", "伊丹市", "相生市", "豊岡市", "加古川市", "赤穂市", "西脇市", "宝塚市", "三木市", "高砂市", "川西市", "小野市", "三田市", "加西市", "丹波篠山市", "養父市", "丹波市", "南あわじ市", "朝来市", "淡路市", "宍粟市", "加東市", "たつの市"],
              "奈良県": ["奈良市", "大和高田市", "大和郡山市", "天理市", "橿原市", "桜井市", "五條市", "御所市", "生駒市", "香芝市", "葛城市", "宇陀市"],
              "和歌山県": ["和歌山市", "海南市", "橋本市", "有田市", "御坊市", "田辺市", "新宮市", "紀の川市", "岩出市"],
              "鳥取県": ["鳥取市", "米子市", "倉吉市", "境港市"],
              "島根県": ["松江市", "浜田市", "出雲市", "益田市", "大田市", "安来市", "江津市", "雲南市"],
              "岡山県": ["岡山市", "倉敷市", "津山市", "玉野市", "笠岡市", "井原市", "総社市", "高梁市", "新見市", "備前市", "瀬戸内市", "赤磐市", "真庭市", "美作市", "浅口市"],
              "広島県": ["広島市", "呉市", "竹原市", "三原市", "尾道市", "福山市", "府中市", "三次市", "庄原市", "大竹市", "東広島市", "廿日市市", "安芸高田市", "江田島市"],
              "山口県": ["下関市", "宇部市", "山口市", "萩市", "防府市", "下松市", "岩国市", "光市", "長門市", "柳井市", "美祢市", "周南市", "山陽小野田市"],
              "徳島県": ["徳島市", "鳴門市", "小松島市", "阿南市", "吉野川市", "阿波市", "美馬市", "三好市"],
              "香川県": ["高松市", "丸亀市", "坂出市", "善通寺市", "観音寺市", "さぬき市", "東かがわ市", "三豊市"],
              "愛媛県": ["松山市", "今治市", "宇和島市", "八幡浜市", "新居浜市", "西条市", "大洲市", "伊予市", "四国中央市", "西予市", "東温市"],
              "高知県": ["高知市", "室戸市", "安芸市", "南国市", "土佐市", "須崎市", "宿毛市", "土佐清水市", "四万十市", "香南市", "香美市"],
              "福岡県": ["北九州市", "福岡市", "大牟田市", "久留米市", "直方市", "飯塚市", "田川市", "柳川市", "八女市", "筑後市", "大川市", "行橋市", "豊前市", "中間市", "小郡市", "筑紫野市", "春日市", "大野城市", "宗像市", "太宰府市", "古賀市", "福津市", "うきは市", "宮若市", "嘉麻市", "朝倉市", "みやま市", "糸島市", "那珂川市"],
              "佐賀県": ["佐賀市", "唐津市", "鳥栖市", "多久市", "伊万里市", "武雄市", "鹿島市", "小城市", "嬉野市", "神埼市"],
              "長崎県": ["長崎市", "佐世保市", "島原市", "諫早市", "大村市", "平戸市", "松浦市", "対馬市", "壱岐市", "五島市", "西海市", "雲仙市", "南島原市"],
              "熊本県": ["熊本市", "八代市", "人吉市", "荒尾市", "水俣市", "玉名市", "山鹿市", "菊池市", "宇土市", "上天草市", "宇城市", "阿蘇市", "天草市", "合志市"],
              "大分県": ["大分市", "別府市", "中津市", "日田市", "佐伯市", "臼杵市", "津久見市", "竹田市", "豊後高田市", "杵築市", "宇佐市", "豊後大野市", "由布市", "国東市"],
              "宮崎県": ["宮崎市", "都城市", "延岡市", "日南市", "小林市", "日向市", "串間市", "西都市", "えびの市"],
              "鹿児島県": ["鹿児島市", "鹿屋市", "枕崎市", "阿久根市", "出水市", "指宿市", "西之表市", "垂水市", "薩摩川内市", "日置市", "曽於市", "霧島市", "いちき串木野市", "南さつま市", "志布志市", "奄美市", "南九州市", "伊佐市", "姶良市"],
              "沖縄県": ["那覇市", "宜野湾市", "石垣市", "浦添市", "名護市", "糸満市", "沖縄市", "豊見城市", "うるま市", "宮古島市", "南城市"]
            };
            
            // 検索用のフラットなリスト
            const citiesFlatList = [];
            Object.entries(citiesData).forEach(([prefecture, cities]) => {
                cities.forEach(city => {
                    citiesFlatList.push({
                        prefecture,
                        city,
                        fullName: prefecture + city
                    });
                });
            });
            
            const prefectures = Object.keys(citiesData);

            // グローバル変数
            let selectedCity = '';
            let searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
            let currentActiveTab = null;

            // 都道府県セレクトボックスを初期化
            const prefectureSelect = document.getElementById('prefectureSelect');
            prefectures.forEach(pref => {
                const option = document.createElement('option');
                option.value = pref;
                option.textContent = pref;
                prefectureSelect.appendChild(option);
            });

            // 都道府県変更時に市区町村を更新
            prefectureSelect.addEventListener('change', (e) => {
                const prefecture = e.target.value;
                const citySelect = document.getElementById('citySelect');
                
                // 市区町村セレクトをクリア
                citySelect.innerHTML = '<option value="">選択してください</option>';
                citySelect.disabled = !prefecture;
                
                if (prefecture && citiesData[prefecture]) {
                    // 最初に都道府県オプションを追加
                    const prefOption = document.createElement('option');
                    prefOption.value = '都道府県';
                    prefOption.textContent = prefecture;
                    citySelect.appendChild(prefOption);
                    
                    // 市区町村リストを追加
                    citiesData[prefecture].forEach(city => {
                        const option = document.createElement('option');
                        option.value = city;
                        option.textContent = city;
                        citySelect.appendChild(option);
                    });
                }
                
                selectedCity = '';
            });

            // 市区町村選択時（自動検索）
            document.getElementById('citySelect').addEventListener('change', async (e) => {
                const prefecture = prefectureSelect.value;
                const city = e.target.value;
                if (prefecture && city) {
                    // 「都道府県」が選択された場合は都道府県名のみ
                    selectedCity = (city === '都道府県') ? prefecture : (prefecture + city);
                    await performSearch();
                }
            });

            // インクリメンタルサーチ
            const searchInput = document.getElementById('citySearchInput');
            const suggestionsDiv = document.getElementById('suggestions');
            
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.trim();
                
                if (query.length === 0) {
                    suggestionsDiv.classList.add('hidden');
                    return;
                }
                
                // 都道府県名での検索
                const prefectureMatches = prefectures.filter(pref => 
                    pref.includes(query)
                ).map(pref => ({
                    prefecture: pref,
                    city: '',
                    fullName: pref,
                    isPrefecture: true
                }));
                
                // 市区町村での検索
                const cityMatches = citiesFlatList.filter(item => 
                    item.city.includes(query) || 
                    item.fullName.includes(query) ||
                    item.prefecture.includes(query)
                );
                
                // 都道府県全域を最初に、その後に市区町村
                const matches = [...prefectureMatches, ...cityMatches].slice(0, 10);
                
                if (matches.length === 0) {
                    suggestionsDiv.innerHTML = '<div class="p-3 text-gray-500">候補が見つかりませんでした</div>';
                    suggestionsDiv.classList.remove('hidden');
                    return;
                }
                
                // 候補を表示
                suggestionsDiv.innerHTML = matches.map(item => \`
                    <div class="suggestion-item p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-200 last:border-b-0 \${item.isPrefecture ? 'bg-green-50' : ''}"
                         data-fullname="\${item.fullName}">
                        <span class="font-semibold text-gray-800">\${item.isPrefecture ? item.prefecture : item.prefecture + ' ' + item.city}</span>
                        \${item.isPrefecture ? '<span class="ml-2 text-xs bg-green-600 text-white px-2 py-1 rounded">都道府県</span>' : ''}
                    </div>
                \`).join('');
                
                // 候補クリック時のイベント
                document.querySelectorAll('.suggestion-item').forEach(item => {
                    item.addEventListener('click', async () => {
                        const fullName = item.dataset.fullname;
                        selectedCity = fullName;
                        searchInput.value = fullName;
                        suggestionsDiv.classList.add('hidden');
                        
                        // 自動で検索実行
                        await performSearch();
                    });
                });
                
                suggestionsDiv.classList.remove('hidden');
            });

            // 候補リスト外をクリックしたら閉じる
            document.addEventListener('click', (e) => {
                if (!searchInput.contains(e.target) && !suggestionsDiv.contains(e.target)) {
                    suggestionsDiv.classList.add('hidden');
                }
            });

            // 検索実行関数
            async function performSearch() {
                const city = selectedCity;
                const inquiryType = document.getElementById('inquiryType').value;

                if (!city) {
                    alert('市区町村を選択してください');
                    return;
                }

                // ローディング表示
                document.getElementById('loading').classList.remove('hidden');
                document.getElementById('resultArea').classList.add('hidden');
                document.getElementById('historyTabs').classList.add('hidden');

                try {
                    // API呼び出し
                    const response = await axios.post('/api/search', {
                        city: city,
                        inquiryType: inquiryType || ''
                    });

                    // 検索履歴に追加
                    addToHistory(city, response.data);
                    
                    // 結果表示
                    displayResult(response.data, city);
                    
                    // タブを表示
                    renderTabs();
                } catch (error) {
                    console.error('Error:', error);
                    
                    // 404エラー（データが見つからない）の場合は、エラーレスポンスを表示
                    if (error.response && error.response.status === 404 && error.response.data) {
                        // 検索履歴に追加
                        addToHistory(city, error.response.data);
                        
                        // 結果表示（データが見つからない場合の表示）
                        displayResult(error.response.data, city);
                        
                        // タブを表示
                        renderTabs();
                    } else {
                        // その他のエラーの場合のみアラート表示
                        alert('検索中にエラーが発生しました');
                    }
                } finally {
                    document.getElementById('loading').classList.add('hidden');
                }
            }

            // 検索履歴に追加（最大5件）
            function addToHistory(city, data) {
                // 都道府県のみの検索かどうかを判定
                const isPrefectureOnly = city.match(/^.+?(都|道|府|県)$/);
                
                // 市町村名のみを抽出（都道府県のみの場合はそのまま）
                const cityNameOnly = isPrefectureOnly ? city : city.replace(/^.+?(都|道|府|県)/, '');
                
                // 既存の同じ市区町村を削除
                searchHistory = searchHistory.filter(item => item.city !== city);
                
                // 先頭に追加
                searchHistory.unshift({
                    city: city,
                    cityNameOnly: cityNameOnly,
                    data: data,
                    timestamp: Date.now()
                });
                
                // 最大5件に制限
                if (searchHistory.length > 5) {
                    searchHistory = searchHistory.slice(0, 5);
                }
                
                // localStorageに保存
                localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
                
                // 最新のタブをアクティブに
                currentActiveTab = city;
            }

            // タブを描画
            function renderTabs() {
                const tabButtons = document.getElementById('tabButtons');
                const historyTabs = document.getElementById('historyTabs');
                const resultArea = document.getElementById('resultArea');
                
                if (searchHistory.length === 0) {
                    historyTabs.classList.add('hidden');
                    resultArea.classList.add('hidden');
                    return;
                }
                
                historyTabs.classList.remove('hidden');
                
                tabButtons.innerHTML = searchHistory.map(item => {
                    const isActive = item.city === currentActiveTab;
                    return \`
                        <div class="relative inline-block">
                            <button 
                                class="tab-button px-4 py-2 pr-8 rounded-t-lg font-semibold transition whitespace-nowrap \${isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
                                data-city="\${item.city}"
                            >
                                \${item.cityNameOnly}
                            </button>
                            <button 
                                class="delete-tab-button absolute right-1 top-1/2 transform -translate-y-1/2 w-5 h-5 rounded-full \${isActive ? 'bg-white text-blue-600 hover:bg-gray-100' : 'bg-gray-400 text-white hover:bg-gray-500'} flex items-center justify-center text-xs font-bold transition"
                                data-city="\${item.city}"
                                title="削除"
                            >
                                ×
                            </button>
                        </div>
                    \`;
                }).join('');
                
                // タブクリックイベント
                document.querySelectorAll('.tab-button').forEach(button => {
                    button.addEventListener('click', () => {
                        const city = button.dataset.city;
                        const historyItem = searchHistory.find(item => item.city === city);
                        if (historyItem) {
                            currentActiveTab = city;
                            displayResult(historyItem.data, city);
                            renderTabs();
                        }
                    });
                });
                
                // 削除ボタンクリックイベント
                document.querySelectorAll('.delete-tab-button').forEach(button => {
                    button.addEventListener('click', (e) => {
                        e.stopPropagation(); // タブクリックイベントを防ぐ
                        const city = button.dataset.city;
                        deleteFromHistory(city);
                    });
                });
            }
            
            // 履歴から削除
            function deleteFromHistory(city) {
                // 履歴から削除
                searchHistory = searchHistory.filter(item => item.city !== city);
                localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
                
                // 削除したタブがアクティブだった場合
                if (currentActiveTab === city) {
                    if (searchHistory.length > 0) {
                        // 最初のタブをアクティブに
                        currentActiveTab = searchHistory[0].city;
                        displayResult(searchHistory[0].data, searchHistory[0].city);
                    } else {
                        // 履歴が空の場合
                        currentActiveTab = null;
                        document.getElementById('resultArea').classList.add('hidden');
                    }
                }
                
                // タブを再描画
                renderTabs();
            }

            // ページ読み込み時に履歴タブを表示
            if (searchHistory.length > 0) {
                currentActiveTab = searchHistory[0].city;
                displayResult(searchHistory[0].data, searchHistory[0].city);
                renderTabs();
            }

            function displayResult(data, city) {
                const resultContent = document.getElementById('resultContent');
                
                // 都道府県のみの検索かどうかを判定
                const isPrefectureOnly = city.match(/^.+?(都|道|府|県)$/);
                
                // 市町村名のみを抽出（都道府県名を除く）、都道府県のみの場合はそのまま
                const cityNameOnly = isPrefectureOnly ? city : city.replace(/^.+?(都|道|府|県)/, '');
                
                // データが見つからない場合の表示
                if (data.error && data.error.includes('登録されていません')) {
                    resultContent.innerHTML = \`
                        <div class="space-y-6">
                            <!-- エラー通知 -->
                            <div class="bg-red-50 border-l-4 border-red-500 p-4">
                                <div class="flex items-start">
                                    <i class="fas fa-exclamation-circle text-red-500 text-2xl mr-3 mt-1"></i>
                                    <div>
                                        <h3 class="text-lg font-bold text-red-800 mb-2">データが見つかりませんでした</h3>
                                        <p class="text-sm text-red-700">
                                            <strong>\${city}</strong> のアスベスト通報先情報はまだデータベースに登録されていません。
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <!-- 代替案の提示 -->
                            <div class="bg-blue-50 border-l-4 border-blue-500 p-4">
                                <h3 class="text-lg font-bold text-blue-800 mb-3">
                                    <i class="fas fa-lightbulb mr-2"></i>
                                    お問い合わせ方法
                                </h3>
                                <div class="space-y-3 text-sm text-blue-900">
                                    <div class="flex items-start">
                                        <i class="fas fa-phone text-blue-600 mr-2 mt-1"></i>
                                        <div>
                                            <p class="font-semibold">1. 市役所・町役場の代表電話に連絡</p>
                                            <p class="text-blue-800">「アスベストの通報先を教えてください」と伝えると、担当部署に繋いでもらえます。</p>
                                        </div>
                                    </div>
                                    <div class="flex items-start">
                                        <i class="fas fa-search text-blue-600 mr-2 mt-1"></i>
                                        <div>
                                            <p class="font-semibold">2. 公式サイトで検索</p>
                                            <p class="text-blue-800">「\${city} アスベスト 通報」で検索すると、担当部署が見つかります。</p>
                                        </div>
                                    </div>
                                    <div class="flex items-start">
                                        <i class="fas fa-building text-blue-600 mr-2 mt-1"></i>
                                        <div>
                                            <p class="font-semibold">3. 主な担当部署</p>
                                            <p class="text-blue-800">環境課、環境保全課、公害対策課などが窓口になっています。</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Google検索ボタン -->
                            <div class="text-center">
                                <a href="https://www.google.com/search?q=\${encodeURIComponent(city + ' アスベスト 通報 連絡先')}" 
                                   target="_blank" 
                                   class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition transform hover:scale-105 shadow-lg">
                                    <i class="fab fa-google mr-2"></i>
                                    \${city}のアスベスト通報先を検索
                                </a>
                            </div>

                            <!-- 参考情報 -->
                            <div class="bg-gray-50 border border-gray-300 rounded-lg p-4">
                                <h3 class="text-sm font-bold text-gray-700 mb-2">
                                    <i class="fas fa-info-circle mr-1"></i>
                                    参考：アスベスト通報の一般的な流れ
                                </h3>
                                <ol class="text-xs text-gray-600 space-y-1 list-decimal list-inside">
                                    <li>市区町村の環境課・公害対策課に連絡</li>
                                    <li>現場の住所・状況を伝える</li>
                                    <li>担当者が現地調査を実施</li>
                                    <li>必要に応じて指導・改善命令</li>
                                </ol>
                            </div>
                        </div>
                    \`;
                    document.getElementById('resultArea').classList.remove('hidden');
                    return;
                }
                
                // 都道府県・市町村名を表示用に整形（担当部署の前に追加）
                const displayDepartment = data.department ? \`\${city} \${data.department}\` : \`\${city} 環境課・公害対策課（要確認）\`;
                
                // メール本文を作成
                const emailSubject = encodeURIComponent('アスベストに関する問い合わせ');
                const emailBody = encodeURIComponent(
                    '【市区町村】\\n' + city + '\\n\\n' +
                    '【担当部署】\\n' + (data.department || '') + '\\n\\n' +
                    '【問い合わせ内容】\\n\\n\\n' +
                    '※このメールは「アスベスト通報システム」から送信されています。'
                );
                
                resultContent.innerHTML = \`
                    <div class="space-y-4">
                        <!-- 注意事項 -->
                        <div class="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4">
                            <p class="text-sm text-yellow-800">
                                <i class="fas fa-exclamation-triangle mr-1"></i>
                                この情報はAIによる自動検索結果です。必ず公式サイトで最新情報をご確認ください。
                            </p>
                        </div>

                        <!-- 担当部署 -->
                        <div>
                            <p class="font-semibold text-gray-700 mb-1">
                                <i class="fas fa-building text-blue-500 mr-1"></i>
                                担当部署
                            </p>
                            <p class="text-gray-800 text-lg">\${displayDepartment}</p>
                        </div>
                        
                        <!-- 電話番号 -->
                        <div>
                            <p class="font-semibold text-gray-700 mb-1">
                                <i class="fas fa-phone text-green-500 mr-1"></i>
                                電話番号
                            </p>
                            <p class="text-gray-800 text-lg">
                                <a href="tel:\${data.phone}" class="text-blue-600 hover:underline">
                                    \${data.phone || '情報なし'}
                                </a>
                            </p>
                        </div>
                        
                        <!-- メールアドレス -->
                        <div>
                            <p class="font-semibold text-gray-700 mb-1">
                                <i class="fas fa-envelope text-purple-500 mr-1"></i>
                                メールアドレス
                            </p>
                            \${data.email ? \`
                                <button 
                                   onclick="(function(){ 
                                       const mailtoLink = 'mailto:\${data.email}?subject=\${emailSubject}&body=\${emailBody}';
                                       window.location.href = mailtoLink;
                                   })()"
                                   class="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition transform hover:scale-105 shadow-md mb-2 cursor-pointer">
                                    <i class="fas fa-envelope mr-2"></i>
                                    メールを送信
                                </button>
                                <p class="text-sm text-gray-600 mt-2">
                                    <a href="mailto:\${data.email}" class="text-blue-600 hover:underline">\${data.email}</a>
                                </p>
                                <p class="text-xs text-gray-500 mt-1">※クリックするとデフォルトのメールアプリが直接起動し、件名と本文が自動入力されます</p>
                            \` : \`
                                <p class="text-gray-600 bg-gray-50 p-3 rounded-lg">
                                    <i class="fas fa-info-circle text-blue-500 mr-1"></i>
                                    メールアドレスが見つかりませんでした。電話またはFAXでお問い合わせください。
                                </p>
                            \`}
                        </div>

                        <!-- 問い合わせフォーム -->
                        <div>
                            <p class="font-semibold text-gray-700 mb-1">
                                <i class="fas fa-edit text-orange-500 mr-1"></i>
                                問い合わせフォーム
                            </p>
                            \${data.formUrl ? \`
                                <a href="\${data.formUrl}" target="_blank" 
                                   class="inline-block bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg transition transform hover:scale-105 shadow-md mb-2">
                                    <i class="fas fa-external-link-alt mr-2"></i>
                                    フォームを開く
                                </a>
                                <p class="text-sm text-gray-600 mt-2 break-all">\${data.formUrl}</p>
                                <p class="text-xs text-gray-500 mt-1">※クリックすると問い合わせフォームが新しいタブで開きます</p>
                            \` : \`
                                <p class="text-gray-600 bg-gray-50 p-3 rounded-lg">
                                    <i class="fas fa-info-circle text-blue-500 mr-1"></i>
                                    オンライン問い合わせフォームが見つかりませんでした。電話またはメールでお問い合わせください。
                                </p>
                            \`}
                        </div>

                        <!-- 区切り線 -->
                        <div class="border-t-2 border-gray-200 my-4"></div>

                        <!-- 公式ページを開くボタン（一番下） -->
                        \${data.pageUrl ? \`
                            <div class="text-center">
                                <a href="\${data.pageUrl}" target="_blank" 
                                   class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition transform hover:scale-105 shadow-lg">
                                    <i class="fas fa-external-link-alt mr-2"></i>
                                    \${cityNameOnly}の公式ページを開く
                                </a>
                            </div>
                        \` : '<p class="text-center text-gray-600">公式ページが見つかりませんでした</p>'}

                    </div>
                \`;
                document.getElementById('resultArea').classList.remove('hidden');
            }
        </script>
    </body>
    </html>
  `)
})

// 手動データベース（Perplexity APIで取得困難な市町村の正確なデータ）
const manualDatabase: Record<string, any> = {
  '東京都八王子市': {
    department: '八王子市環境部環境保全課',
    phone: '042-620-7217',
    email: null,
    formUrl: 'https://www.city.hachioji.tokyo.jp/inquiry/mailform111100.html?PAGE_NO=7060',
    pageUrl: 'https://www.city.hachioji.tokyo.jp/kurashi/life/004/006/p007060.html',
    departments: [
      {
        name: '環境保全課（環境について）',
        phone: '042-620-7217'
      },
      {
        name: '建築指導課（建築物について）',
        phone: '042-620-7264'
      },
      {
        name: '廃棄物対策課（廃棄物について）',
        phone: '042-620-7458'
      },
      {
        name: '保健所（健康について）',
        phone: '042-645-5111'
      }
    ]
  },
  '石川県金沢市': {
    department: '金沢市環境政策課',
    phone: '076-220-2508',
    email: 'tikiho@city.kanazawa.lg.jp',
    formUrl: 'https://www4.city.kanazawa.lg.jp/cgi-bin/inquiry.php/68?page_no=3624',
    pageUrl: 'https://www4.city.kanazawa.lg.jp/soshikikarasagasu/kankyoseisakuka/gyomuannai/3/3/asbestos/index.html',
    departments: [
      {
        name: '環境政策課（事業所及び建物等）',
        phone: '076-220-2508',
        email: 'メール送信フォームあり'
      },
      {
        name: '保健所（健康について）',
        phone: '076-234-5116',
        email: 'tikiho@city.kanazawa.lg.jp'
      }
    ]
  }
}

// 検索ログを保存する簡易的なメモリストア（実運用ではDBを使用）
const searchLogs: Array<{
  city: string
  timestamp: string
  success: boolean
  source: 'manual' | 'api'
  hasPhone: boolean
  hasEmail: boolean
  hasFormUrl: boolean
  error?: string
}> = []

// API: 検索ログを取得
app.get('/api/search-logs', (c) => {
  return c.json(searchLogs)
})

// API: 検索ログをクリア
app.delete('/api/search-logs', (c) => {
  searchLogs.length = 0
  return c.json({ message: 'ログをクリアしました' })
})

// API: 問い合わせ先検索（手動データベースのみ使用）
app.post('/api/search', async (c) => {
  const { city, inquiryType } = await c.req.json()
  
  try {
    if (!city) {
      return c.json({ error: '市町村名を入力してください' }, 400)
    }
    
    // 手動データベースをチェック
    if (manualDatabase[city]) {
      console.log(`✅ 手動データベースから取得: ${city}`)
      const result = manualDatabase[city]
      
      // ログを記録
      searchLogs.push({
        city,
        timestamp: new Date().toISOString(),
        success: true,
        source: 'manual',
        hasPhone: !!result.phone,
        hasEmail: !!result.email,
        hasFormUrl: !!result.formUrl
      })
      
      return c.json(result)
    }
    
    // データが見つからない場合
    console.log(`❌ データベースに登録されていません: ${city}`)
    
    // ログを記録
    searchLogs.push({
      city,
      timestamp: new Date().toISOString(),
      success: false,
      source: 'manual',
      hasPhone: false,
      hasEmail: false,
      hasFormUrl: false,
      error: 'データベースに登録されていません'
    })
    
    return c.json({ 
      error: 'データベースに登録されていません',
      department: `${city} の環境課`,
      phone: '市役所・町役場の代表電話にお問い合わせください',
      email: null,
      formUrl: null,
      pageUrl: null,
      message: 'この市町村のデータはまだ登録されていません。市役所・町役場の代表電話にお問い合わせいただくか、公式サイトをご確認ください。'
    }, 404)
    
  } catch (error) {
    console.error('Search error:', error)
    
    // エラーログを記録
    searchLogs.push({
      city,
      timestamp: new Date().toISOString(),
      success: false,
      source: 'manual',
      hasPhone: false,
      hasEmail: false,
      hasFormUrl: false,
      error: error instanceof Error ? error.message : '不明なエラー'
    })
    
    return c.json({ 
      error: '検索中にエラーが発生しました',
      department: '情報を取得できませんでした',
      phone: '市役所の代表電話にお問い合わせください',
      email: null,
      formUrl: null,
      pageUrl: null
    }, 500)
  }
})

/* 
===========================================
Perplexity API関連のコード（バックグラウンド保管）
===========================================

将来的にAPI検索機能を再度有効にする場合は、以下のコードを使用してください。

// 問い合わせタイプに応じた対象部局を決定
function getTargetDepartments(inquiryType: string): string[] {
  const departmentMap: Record<string, string[]> = {
    'survey': ['環境部局'],
    'prevention': ['環境部局'],
    'safety': ['労働基準監督署'],
    'waste': ['廃棄物部局'],
    'health': ['保健部局', '労働基準監督署']
  }
  return departmentMap[inquiryType] || ['環境部局']
}

// Perplexity APIのプロンプトやparseAIResponse関数など、
// 約300行のコードがここに保存されていました。
// 必要に応じて、Gitの履歴から復元できます。

===========================================
*/

export default app
