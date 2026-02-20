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
    suggestionsDiv.innerHTML = matches.map(item => `
        <div class="suggestion-item p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-200 last:border-b-0 ${item.isPrefecture ? 'bg-green-50' : ''}"
             data-fullname="${item.fullName}">
            <span class="font-semibold text-gray-800">${item.isPrefecture ? item.prefecture : item.prefecture + ' ' + item.city}</span>
            ${item.isPrefecture ? '<span class="ml-2 text-xs bg-green-600 text-white px-2 py-1 rounded">都道府県</span>' : ''}
        </div>
    `).join('');
    
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
        return `
            <div class="relative inline-block">
                <button 
                    class="tab-button px-4 py-2 pr-8 rounded-t-lg font-semibold transition whitespace-nowrap ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
                    data-city="${item.city}"
                >
                    ${item.cityNameOnly}
                </button>
                <button 
                    class="delete-tab-button absolute right-1 top-1/2 transform -translate-y-1/2 w-5 h-5 rounded-full ${isActive ? 'bg-white text-blue-600 hover:bg-gray-100' : 'bg-gray-400 text-white hover:bg-gray-500'} flex items-center justify-center text-xs font-bold transition"
                    data-city="${item.city}"
                    title="削除"
                >
                    ×
                </button>
            </div>
        `;
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
    
    // URL検証とデバッグログ
    if (data.pageUrl) {
        console.log('📎 公式ページURL:', data.pageUrl);
        console.log('📎 URL type:', typeof data.pageUrl);
        console.log('📎 URL starts with http:', data.pageUrl.startsWith('http'));
    }
    
    // 都道府県のみの検索かどうかを判定
    const isPrefectureOnly = city.match(/^.+?(都|道|府|県)$/);
    
    // 市町村名のみを抽出（都道府県名を除く）、都道府県のみの場合はそのまま
    const cityNameOnly = isPrefectureOnly ? city : city.replace(/^.+?(都|道|府|県)/, '');
    
    // エラー処理
    if (data.error) {
        resultContent.innerHTML = `
            <div class="text-center bg-red-50 p-8 rounded-lg border-2 border-red-300">
                <h2 class="text-xl font-bold text-red-800 mb-4">
                    <i class="fas fa-exclamation-triangle mr-2"></i>
                    情報が見つかりませんでした
                </h2>
                <p class="text-gray-700 mb-4">${data.error}</p>
                <a href="https://www.google.com/search?q=${encodeURIComponent(city + ' アスベスト 相談')}" 
                   target="_blank" 
                   class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition">
                    <i class="fab fa-google mr-2"></i>
                    Googleで検索
                </a>
            </div>
        `;
        document.getElementById('resultArea').classList.remove('hidden');
        return;
    }
    
    // 新形式（departments配列）の処理
    if (data.departments && data.departments.length > 0) {
        const departmentsHTML = data.departments.map(dept => `
            <div class="bg-white border-2 border-blue-200 rounded-lg p-6 shadow-md">
                <h3 class="text-lg font-bold text-gray-800 mb-4">
                    <i class="fas fa-building text-blue-600 mr-2"></i>
                    ${dept.category}
                </h3>
                <div class="space-y-3">
                    <div>
                        <span class="text-sm font-semibold text-gray-600">担当部署:</span>
                        <p class="text-gray-800">${dept.name}</p>
                    </div>
                    ${dept.phone ? `
                        <div>
                            <span class="text-sm font-semibold text-gray-600">📞 電話番号:</span>
                            <div class="text-gray-800 whitespace-pre-line">${dept.phone.split('\n').map(line => 
                                `<div class="my-1"><a href="tel:${line.replace(/[^0-9-]/g, '')}" class="text-blue-600 hover:underline">${line}</a></div>`
                            ).join('')}</div>
                        </div>
                    ` : ''}
                    ${dept.email ? `
                        <div>
                            <span class="text-sm font-semibold text-gray-600">📧 メール:</span>
                            <p><a href="mailto:${dept.email}" class="text-blue-600 hover:underline">${dept.email}</a></p>
                        </div>
                    ` : ''}
                    ${dept.formUrl ? `
                        <div>
                            <a href="${dept.formUrl}" target="_blank" 
                               class="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition">
                                <i class="fas fa-envelope mr-2"></i>
                                問い合わせフォーム
                            </a>
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
        
        resultContent.innerHTML = `
            <div class="space-y-6">
                ${data.pageUrl ? `
                    <div class="text-center bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-lg border-2 border-blue-300">
                        <h2 class="text-2xl font-bold text-gray-800 mb-4">
                            <i class="fas fa-external-link-alt text-blue-600 mr-2"></i>
                            ${cityNameOnly}のアスベスト相談窓口
                        </h2>
                        <p class="text-gray-700 mb-6">
                            以下のボタンから公式ページにアクセスして、最新の情報をご確認ください
                        </p>
                        <a href="${data.pageUrl}" target="_blank" 
                           class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-lg transition transform hover:scale-105 shadow-lg text-lg">
                            <i class="fas fa-external-link-alt mr-2"></i>
                            公式ページを開く
                        </a>
                    </div>
                ` : ''}
                ${departmentsHTML}
            </div>
        `;
        document.getElementById('resultArea').classList.remove('hidden');
        return;
    }
    
    // 旧形式（department, phone等）の処理（後方互換性）
    resultContent.innerHTML = `
        <div class="space-y-6">
            ${data.pageUrl ? `
                <div class="text-center bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-lg border-2 border-blue-300">
                    <h2 class="text-2xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-external-link-alt text-blue-600 mr-2"></i>
                        ${cityNameOnly}のアスベスト相談窓口
                    </h2>
                    <a href="${data.pageUrl}" target="_blank" 
                       class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-lg transition transform hover:scale-105 shadow-lg text-lg">
                        <i class="fas fa-external-link-alt mr-2"></i>
                        公式ページを開く
                    </a>
                </div>
            ` : ''}
        </div>
    `;
    document.getElementById('resultArea').classList.remove('hidden');
}
