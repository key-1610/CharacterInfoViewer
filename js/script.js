// 1回だけ登録する用のフラグ
let pluginsRegistered = false;
let radarChart = null;  // ここで宣言しておく

/**
 * テキストエリアからJSON文字列を取得し、パースして表示内容を生成・更新する関数。
 * - JSONは特定のフォーマット(character kindのデータ)であることを想定。
 * - 基本情報、ステータス、パラメータ、コマンド一覧の各セクションをHTMLに描画する。
 * - パラメータはレーダーチャートで可視化し、編集可能。
 * - コピー機能やフィルタリング、並び替えなどのUIも初期化する。
 *
 * @throws {SyntaxError} JSON.parse失敗時にスローされる
 */
function parseJson() {
    const input = document.getElementById("jsonInput").value;
    const output = document.getElementById("output");
    output.innerHTML = "";

    try {
        const json = JSON.parse(input);
        if (json.kind !== "character") {
            output.innerHTML = "<p>⚠️ characterデータではありません。</p>";
            return;
        }

        const data = json.data;
        const name = data.name || "名前不明";
        const initiative = data.initiative || "不明";

        const basicInfo = `
<div class="section">
<h2>基本情報</h2>
<div class="field">
<div class="label">名前</div>
<div class="value-container">
<input type="text" id="charName" value="${name}" />
<button class="copy-btn" onclick="copyToClipboard('charName')">
<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
<path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
</svg>
</button>
<div class="success-message" id="successMessage-charName">コピーしました</div>
</div>
</div>
<div class="field">
<div class="label">イニシアティブ</div>
<div class="value-container">
<input type="text" id="initiative" value="${initiative}" />
<button class="copy-btn" onclick="copyToClipboard('initiative')">
<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
<path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
</svg>
</button>
<div class="success-message" id="successMessage-initiative">コピーしました</div>
</div>
</div>
</div>`;

        const excludedLabels = ["DB", "CT", "FT"];
        const filteredStatus = Array.isArray(data.status) ? data.status.filter(s => !excludedLabels.includes(s.label)) : [];
        const statusFieldsHtml = filteredStatus.map((s, i) => `
<div class="field">
<div class="label">${s.label}</div>
<div class="value-container">
<input type="text" id="statusValue-${i}" value="${s.value}" style="width: 50px; text-align: right;" />
<button class="copy-btn" onclick="copyToClipboard('statusValue-${i}')">
<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
<path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
</svg>
</button>
<div class="success-message" id="successMessage-statusValue-${i}">コピーしました</div>
</div>
</div>
`).join("");

        const statusBlock = `
<div class="section">
<h2 style="display:flex; align-items:center; gap:10px;">
ステータス
<button class="copy-btn" id="copyStatusTabBtn">一括コピー(列)</button>
<label class="toggle-switch">
<input type="checkbox" id="toggleStatusCopyMode">
<span class="slider"></span>
</label>
<div class="success-message" id="successMessage-copyStatusTabBtn">コピーしました</div>
</h2>
${statusFieldsHtml}
</div>`;

        const filteredParams = Array.isArray(data.params) ? data.params.filter(p => !excludedLabels.includes(p.label)) : [];
        const paramLabels = filteredParams.map(p => p.label);
        const paramValues = filteredParams.map(p => p.value);

        // paramsBlock修正：value部分をinputに変更
        const paramsBlock = `
<div class="section">
<h2 style="display:flex; align-items:center; gap:10px;">
パラメータ
<button class="copy-btn" id="copyParamsTabBtn">一括コピー(列)</button>
<label class="toggle-switch">
<input type="checkbox" id="toggleCopyMode">
<span class="slider"></span>
</label>
<div class="success-message" id="successMessage-copyParamsTabBtn">コピーしました</div>
</h2>
<div class="param-chart-and-list">
<div class="param-chart-wrapper">
<button class="download-btn" onclick="downloadRadarChartImage('${name}')" title="レーダーチャートを画像として保存">
<i class="fas fa-download"></i>
</button>
<canvas id="paramRadarChart" width="480" height="480"></canvas>
</div>
<div class="params-list">
${filteredParams.map((p, i) => `
<div class="field">
<div class="label">${p.label}</div>
<div class="value-container">
<input type="text" id="paramValue-${i}" value="${p.value}" style="width: 50px; text-align: right;" />
<button class="copy-btn" onclick="copyToClipboard('paramValue-${i}')">
<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
<path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
</svg>
</button>
<div class="success-message" id="successMessage-paramValue-${i}">コピーしました</div>
</div>
</div>`).join("")}
</div>
</div>
</div>`;


        const commandsTableRows = parseCommandsToTable(data.commands, data.params);
        const commandsTableHtml = `
<div class="section" style="margin-bottom:4em">
  <h2 style="display:flex; align-items:center; gap:10px;">
    コマンド一覧
    <button class="copy-btn" id="copyCommandsAllBtn">一括コピー</button>
    <div class="success-message" id="successMessage-copyCommandsAllBtn">コピーしました</div>
  </h2>
  <div style="margin-bottom: 8px;">
    <label><input type="checkbox" class="filter-type" value="パラメータ" checked> パラメータ</label>
    <label><input type="checkbox" class="filter-type" value="技能" checked> 技能</label>
    <label><input type="checkbox" class="filter-type" value="その他" checked> その他</label>
    <label style="margin-left:20px;">
      <input type="checkbox" id="filterThreeMajorSkills"> 探索三大技能のみ表示
    </label>
  </div>
  <div id="commandsTableContainer">
  <table id="commandsTable" border="1" cellspacing="0" cellpadding="4" style="width: 100%; border-collapse: collapse; text-align: left;">
    <thead>
      <tr>
        <th data-sort="type" style="cursor:pointer;">タイプ ▲▼</th>
        <th data-sort="name" style="cursor:pointer;">名称 ▲▼</th>
        <th data-sort="value" style="cursor:pointer;">値 ▲▼</th>
        <th>コピー</th>
      </tr>
    </thead>
    <tbody>
      ${commandsTableRows.map((row, i) => `
        <tr data-type="${row.type}">
          <td>${row.type}</td>
          <td>${row.name}</td>
          <td>${row.value}</td>
          <td>
            <button class="copy-btn" data-copy-text="${row.raw}" title="行コピー">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
              </svg>
            </button>
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  </div>
</div>
`;

        output.innerHTML = basicInfo + statusBlock + paramsBlock + commandsTableHtml;

        setupCopyParamsTabBtn({ params: filteredParams });
        setupCopyStatusTabBtn({ status: filteredStatus });
        setupCommandsTable();

        if (!pluginsRegistered) {
            Chart.register(createRadarBackgroundPlugin('rgba(212, 213, 205, 1)'));
            Chart.register(createCenteredPointLabelsPlugin({ fontSize: 16, offset: 24 }));
            pluginsRegistered = true;
        }

        if (radarChart) radarChart.destroy();

        radarChart = new Chart(document.getElementById("paramRadarChart"), {
            type: "radar",
            data: {
                labels: paramLabels,
                datasets: [{
                    label: "",
                    data: paramValues,
                    backgroundColor: "rgba(152, 153, 232, 0.7)",
                    borderWidth: 0,
                    pointBackgroundColor: "transparent"
                }]
            },
            options: {
                responsive: false,
                scales: {
                    r: {
                        suggestedMin: 0,
                        suggestedMax: 20,
                        ticks: { stepSize: 1, display: false },
                        pointLabels: { display: false },
                        angleLines: { color: "#fff", borderWidth: 2 },
                        grid: { color: "transparent" }
                    }
                },
                plugins: {
                    legend: { display: false },
                    title: { display: false },
                    tooltip: {
                        callbacks: {
                            label: context => `${context.label}: ${context.formattedValue}`
                        }
                    },
                    radarBackgroundPlugin: {},      // プラグイン有効化（id名）
                    centeredPointLabels: {}         // プラグイン有効化
                },
                elements: {
                    line: { borderWidth: 2, fill: true },
                    point: { radius: 0 }
                },
                layout: { padding: 60 }
            }
        });

        // 入力フォームにイベントを登録してチャート更新
        filteredParams.forEach((p, i) => {
            const input = document.getElementById(`paramValue-${i}`);
            if (input) {
                input.addEventListener('input', () => {
                    const val = Number(input.value);
                    if (!isNaN(val)) {
                        radarChart.data.datasets[0].data[i] = val;
                        radarChart.update();
                    }
                });
            }
        });

    } catch (e) {
        output.innerHTML = `<p style="color:red;">❌ JSONの解析に失敗しました: ${e.message}</p>`;
    }
}

/**
 * 入力フォームのJSONテキストエリアと出力表示エリアをクリアする。
 *
 * @returns {void}
 */
function clearInput() {
    document.getElementById("jsonInput").value = "";
    document.getElementById("output").innerHTML = "";
}

/**
 * 指定した要素のテキストまたは入力値をクリップボードにコピーする。
 * コピー成功時には対応する成功メッセージ要素にクラスを付与して1秒間表示する。
 * コピー失敗時にはアラートを表示する。
 *
 * @param {string} elementId - コピー対象の要素のID。
 * @returns {void}
 */
function copyToClipboard(elementId) {
    const el = document.getElementById(elementId);
    let text = "";
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        text = el.value;
    } else {
        text = el.innerText;
    }
    navigator.clipboard.writeText(text).then(() => {
        const msg = document.getElementById("successMessage-" + elementId);
        if (msg) {
            msg.classList.add("visible");
            setTimeout(() => msg.classList.remove("visible"), 1000);
        }
    }).catch(() => alert("コピーに失敗しました"));
}

/**
 * パラメータの一括コピー用ボタンとトグルスイッチをセットアップする。
 * トグルの状態に応じてコピー形式（行または列）を切り替え、
 * ボタンクリックでデータをクリップボードにコピーする機能を提供する。
 * コピー成功時には成功メッセージを1秒間表示する。
 *
 * @param {Object} data - コピー対象データのオブジェクト。
 * @param {Array<{label: string, value: string|number}>} data.params - コピーするパラメータの配列。
 * @returns {void}
 */
function setupCopyParamsTabBtn(data) {
    const btn = document.getElementById('copyParamsTabBtn');
    const toggle = document.getElementById('toggleCopyMode');
    const msg = document.getElementById('successMessage-copyParamsTabBtn');

    if (!btn || !toggle) return;

    const updateButtonLabel = () => {
        btn.innerText = toggle.checked ? "一括コピー(行)" : "一括コピー(列)";
    };

    toggle.addEventListener('change', updateButtonLabel);
    updateButtonLabel();

    btn.addEventListener('click', () => {
        let text = toggle.checked
            ? `${data.params.map(p => p.label).join('\t')}\n${data.params.map(p => p.value).join('\t')}`
            : data.params.map(p => `${p.label}\t${p.value}`).join('\n');

        navigator.clipboard.writeText(text).then(() => {
            msg.classList.add('visible');
            setTimeout(() => msg.classList.remove('visible'), 1000);
        }).catch(() => alert('コピーに失敗しました'));
    });
}

/**
 * Chart.jsのレーダーチャート用の背景塗りつぶしプラグインを作成する。
 * レーダーチャートの外周ポリゴンを指定色で塗りつぶす。
 *
 * @param {string} [fillColor='rgba(212, 213, 205, 1)'] - 塗りつぶしの色（CSSカラー文字列）
 * @returns {Object} Chart.jsプラグインオブジェクト
 */
function createRadarBackgroundPlugin(fillColor = 'rgba(212, 213, 205, 1)') {
    return {
        id: 'radarBackgroundPlugin',
        beforeDraw(chart) {
            const { ctx, scales } = chart;
            const rScale = scales.r;
            if (!rScale) return;

            const centerX = rScale.xCenter;
            const centerY = rScale.yCenter;
            const pointCount = rScale._pointLabels.length;
            const radius = rScale.drawingArea;

            ctx.save();
            ctx.beginPath();
            for (let i = 0; i < pointCount; i++) {
                const angle = (Math.PI * 2 / pointCount) * i - Math.PI / 2;
                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fillStyle = fillColor;
            ctx.fill();
            ctx.restore();
        }
    };
}

/**
 * Chart.jsのレーダーチャートで、各頂点のラベルと対応する値を
 * 頂点外側に中央揃えで描画するプラグインを作成する。
 *
 * @param {Object} [options={}] - カスタマイズ用オプション
 * @param {number} [options.fontSize=12] - フォントサイズ(px)
 * @param {string} [options.fontFamily='sans-serif'] - フォントファミリー
 * @param {string} [options.fontColor='#444'] - フォントカラー(CSSカラー値)
 * @param {number} [options.offset=20] - ラベルを頂点からどれだけ外側にずらすかの距離(px)
 * @param {number} [options.lineHeight=16] - ラベル間の縦方向の間隔(px)
 * @returns {Object} Chart.jsプラグインオブジェクト
 */
function createCenteredPointLabelsPlugin(options = {}) {
    const {
        fontSize = 12,
        fontFamily = 'Roboto', 'sans-serif';
        fontColor = '#444',
        offset = 20,
        lineHeight = 16
    } = options;

    return {
        id: 'centeredPointLabels',
        afterDraw(chart) {
            const { ctx, scales, data } = chart;
            const rScale = scales.r;
            if (!rScale) return;

            const labels = data.labels || [];
            const values = (data.datasets && data.datasets[0] && data.datasets[0].data) || [];

            ctx.save();
            ctx.fillStyle = fontColor;
            ctx.font = `${fontSize}px ${fontFamily}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const centerX = rScale.xCenter;
            const centerY = rScale.yCenter;
            const radius = rScale.drawingArea;
            const count = labels.length;

            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 / count) * i - Math.PI / 2;
                const x = centerX + (radius + offset) * Math.cos(angle);
                const y = centerY + (radius + offset) * Math.sin(angle);
                ctx.fillText(labels[i], x, y - lineHeight / 2);
                ctx.fillText(values[i], x, y + lineHeight / 2);
            }

            ctx.restore();
        }
    };
}

/**
 * レーダーチャートのキャンバス画像をPNG形式でダウンロードする。
 * ファイル名に使用できない記号は自動で置換される。
 *
 * @param {string} [name="キャラクター"] - ダウンロードファイル名のベースとなる文字列
 */
function downloadRadarChartImage(name = "キャラクター") {
    const canvas = document.getElementById("paramRadarChart");
    if (!canvas) {
        alert("チャートがまだ表示されていません");
        return;
    }

    const pngUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");

    const safeName = name.replace(/[\\/:*?"<>|]/g, "_"); // ファイル名に使えない記号を除去
    a.download = `${safeName}_レーダーチャート.png`;
    a.href = pngUrl;
    a.click();
}

/**
 * ステータスのコピー用ボタンとモード切替トグルをセットアップする関数。
 * 行コピーモードと列コピーモードを切り替えられ、入力値をリアルタイムで取得してクリップボードにコピーする。
 * 
 * @param {Object} data - ステータス情報を含むデータオブジェクト
 * @param {Array<{label: string, value: string|number}>} data.status - コピー対象のステータス配列
 */
function setupCopyStatusTabBtn(data) {
    const btn = document.getElementById('copyStatusTabBtn');
    const toggle = document.getElementById('toggleStatusCopyMode');
    const msg = document.getElementById('successMessage-copyStatusTabBtn');

    if (!btn || !toggle) return;

    const updateButtonLabel = () => {
        btn.innerText = toggle.checked ? "一括コピー(行)" : "一括コピー(列)";
    };

    toggle.addEventListener('change', updateButtonLabel);
    updateButtonLabel();

    btn.addEventListener('click', () => {
        // ラベル配列
        const labels = data.status.map(s => s.label);
        // 値配列。inputの値をリアルタイムで取得したいのでDOMから取得
        const values = data.status.map((s, i) => {
            const el = document.getElementById(`statusValue-${i}`);
            return el ? el.value : s.value;
        });

        let text = "";

        if (toggle.checked) {
            // 行コピー: ラベルと値をタブ区切りで1行ずつ
            text = labels.map((label, i) => `${label}\t${values[i]}`).join('\n');
        } else {
            // 列コピー: ラベルを1行目、値を2行目にタブ区切りで
            text = labels.join('\t') + '\n' + values.join('\t');
        }

        navigator.clipboard.writeText(text).then(() => {
            msg.classList.add('visible');
            setTimeout(() => msg.classList.remove('visible'), 1000);
        }).catch(() => alert('コピーに失敗しました'));
    });
}

/**
 * パラメータ式を評価して数値に変換する関数
 * 例: "{STR}*5" → 11*5 → 55
 * @param {string} expr - 式文字列
 * @param {Array} params - パラメータ配列 [{label:'STR', value:11}, ...]
 * @returns {number|string} 計算結果 or 元文字列（計算失敗時）
 */
function evalParamExpression(expr, params) {
    // {XXX} を対応するパラメータ値に置換
    const replaced = expr.replace(/\{(\w+)\}/g, (match, p1) => {
        const param = params.find(p => p.label === p1);
        return param ? param.value : '0';  // パラメータ未定義なら0
    });

    try {
        // 安全な評価。evalの代わりにFunctionコンストラクタを使用。
        // ここで計算式（例: "11*5"）を計算して数値化
        const result = Function(`return (${replaced})`)();
        return typeof result === 'number' ? result : replaced;
    } catch {
        // 計算できなければ置換済みの文字列を返す
        return replaced;
    }
}

/**
 * コマンド一覧解析・テーブル化
 * @param {string} commandsText - コマンドテキスト（改行区切り）
 * @param {Array} params - パラメータ配列（例：[{label:"STR", value:"5"}, ...]）
 * @returns {Array} 解析結果のテーブルデータ配列
 */
function parseCommandsToTable(commandsText, params) {
    const lines = commandsText.split('\n');
    const sanCheckTag = '{SAN}';
    const paramKeywords = ['STR', 'CON', 'POW', 'DEX', 'APP', 'SIZ', 'INT', 'EDU'];
    const paramNames = params.map(p => p.label);

    // パラメータや数式を含む技能判定の正規表現（CCB<=に続く式）
    const skillPattern = /CCB<=([0-9{}\*\+\-\/]+)/i;

    const tableData = [];

    for (const line of lines) {
        let type = '';
        let value = '';
        let name = '';

        if (!line.trim()) continue;  // 空行スキップ

        if (line.includes(sanCheckTag)) {
            // 正気度ロール判定
            type = 'パラメータ';
            value = sanCheckTag;
            name = '正気度ロール';

        } else {
            const containsParamKeyword = paramKeywords.some(keyword => line.includes(keyword));
            if (containsParamKeyword) {
                type = 'パラメータ';
                const paramMatch = line.match(/CCB<=([^\s]+)/);
                if (paramMatch) {
                    const expr = paramMatch[1];
                    name = line.substring(line.indexOf(expr) + expr.length).trim() || 'パラメータ判定';
                    value = evalParamExpression(expr, params);  // ここは既存の関数使用
                }
                else {
                    name = 'パラメータ判定';
                    value = '';  // ここは既存の関数使用
                }

            } else {

                // CCB<=付き行の判定
                const paramMatch = line.match(/CCB<=([^\s]+)/);
                if (paramMatch) {
                    const expr = paramMatch[1];

                    // 式中にパラメータ名が含まれているかチェック
                    const containsParam = paramNames.some(pn => expr.includes(`{${pn}}`));

                    if (containsParam) {
                        // パラメータ式の評価
                        value = evalParamExpression(expr, params);  // ここは既存の関数使用
                        type = 'パラメータ';
                        // スキル名部分を取得（CCB<=xxxx の後の文字列）
                        name = line.substring(line.indexOf(expr) + expr.length).trim() || 'パラメータ判定';

                    } else {
                        // 数値だけの技能判定
                        const skillMatch = line.match(skillPattern);
                        if (skillMatch) {
                            type = '技能';
                            value = skillMatch[1];
                            name = line.substring(line.indexOf(skillMatch[1]) + skillMatch[1].length).trim() || '技能判定';
                        } else {
                            // その他（通常はここは通らない想定）
                            type = 'その他';
                            value = '';
                            name = line.trim();
                        }
                    }

                } else {
                    // CCB<=がない行は「数式＋名前」に分ける（数式は英数字＋記号の連続）
                    const match = line.match(/^(\S+)\s+(.*)$/);
                    if (match) {
                        type = 'その他';
                        value = match[1];  // "1D6+{DB}"
                        name = match[2];   // "キック"
                    } else {
                        // 数式が取れなければ全体を名前に
                        type = 'その他';
                        value = '';
                        name = line.trim();
                    }
                }
            }
        }

        tableData.push({ type, value, name, raw: line });
    }

    return tableData;
}

/**
 * コマンド一覧テーブルに対して、フィルタ機能・ソート機能・コピー機能をセットアップする。
 * 
 * - フィルタ: 複数チェックボックスによる種類フィルタと三大技能のみ表示切替
 * - ソート: テーブルヘッダーのクリックで昇順・降順切替
 * - コピー: 各行のコピー・表示行全コピー機能
 * 
 * @returns {void}
 */
function setupCommandsTable() {

    const filterCheckboxes = [...document.querySelectorAll('.filter-type')];
    const filterThreeMajor = document.getElementById('filterThreeMajorSkills');
    const table = document.getElementById('commandsTable');
    if (!table) return;
    const tbody = table.querySelector('tbody');
    const allRows = Array.from(document.querySelectorAll('#commandsTable tbody tr'));

    // 探索三大技能名称リスト
    const threeMajorSkills = ['聞き耳', '目星', '図書館'];

    // 部分一致で三大技能か判定
    function isThreeMajorSkill(name) {
        return threeMajorSkills.some(skill => name.includes(skill));
    }

    function filterRows() {
        const checkedTypes = filterCheckboxes.filter(chk => chk.checked).map(chk => chk.value);
        const filterThree = filterThreeMajor.checked;

        allRows.forEach(row => {
            const type = row.getAttribute('data-type');
            const name = row.cells[1].innerText;
            const isThreeMajor = isThreeMajorSkill(name);
            const visible = checkedTypes.includes(type) && (!filterThree || isThreeMajor);
            row.style.display = visible ? '' : 'none';
        });
    }

    filterCheckboxes.forEach(chk => chk.addEventListener('change', filterRows));
    filterThreeMajor.addEventListener('change', filterRows);
    filterRows();

    // 以下は元のまま（ソート、コピー機能など）
    const headers = [...table.querySelectorAll('thead th[data-sort]')];
    let sortColumn = null;
    let sortAsc = true;

    function sortTableByKey(key, asc = true) {
        const header = headers.find(h => h.getAttribute('data-sort') === key);
        if (!header) return;

        const columnIndex = headers.indexOf(header);
        const sortedRows = allRows.sort((a, b) => {
            const aText = a.cells[columnIndex].innerText;
            const bText = b.cells[columnIndex].innerText;
            if (!isNaN(aText) && !isNaN(bText)) {
                return asc ? aText - bText : bText - aText;
            }
            return asc ? aText.localeCompare(bText) : bText.localeCompare(aText);
        });

        sortedRows.forEach(row => tbody.appendChild(row));
    }

    headers.forEach(header => {
        header.addEventListener('click', () => {
            const key = header.getAttribute('data-sort');
            if (sortColumn === key) sortAsc = !sortAsc;
            else {
                sortColumn = key;
                sortAsc = true;
            }
            sortTableByKey(key, sortAsc);
        });
    });

    filterRows();

    // ✅ 初期並び順を指定（例：typeで昇順）
    sortTableByKey('type', false);

    table.querySelectorAll('button.copy-btn[data-copy-text]').forEach((btn, index) => {
        btn.addEventListener('click', () => {
            const text = btn.getAttribute('data-copy-text');
            if (!text) return;

            navigator.clipboard.writeText(text).then(() => {
                let msg = btn.parentElement.querySelector('.success-message');
                if (!msg) {
                    msg = document.createElement('span');
                    msg.className = 'success-message';
                    msg.textContent = 'コピーしました';
                    btn.parentElement.appendChild(msg);
                }

                msg.classList.add('visible');
                setTimeout(() => msg.classList.remove('visible'), 1000);
            }).catch(() => {
                alert('コピーに失敗しました');
            });
        });
    });

    const copyAllBtn = document.getElementById('copyCommandsAllBtn');
    const msg = document.getElementById('successMessage-copyCommandsAllBtn');

    if (copyAllBtn && msg) {
        copyAllBtn.addEventListener('click', () => {
            // 表示されている行だけ取得
            const rows = Array.from(table.querySelectorAll('tbody tr'))
                .filter(row => row.style.display !== 'none');

            // 表示中の行のボタンからコピー用テキストを取得
            const lines = rows.map(row => {
                const btn = row.querySelector('button.copy-btn');
                return btn ? btn.getAttribute('data-copy-text') : '';
            }).filter(Boolean);

            const text = lines.join('\n');
            navigator.clipboard.writeText(text).then(() => {
                msg.classList.add('visible');
                setTimeout(() => msg.classList.remove('visible'), 1000);
            }).catch(() => alert('コピーに失敗しました'));
        });
    }
}
