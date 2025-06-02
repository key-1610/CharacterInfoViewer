// キャラクターの初期スキル定義
const baseSkills = {
    'こぶし': 50,
    'キック': 25,
    '組み付き': 25,
    '組みつき': 25,
    '頭突き': 10,
    '回避': 0,
    '目星': 25,
    '聞き耳': 25,
    '図書館': 25,
    '母国語': 0,
    'クトゥルフ神話': 0,
    'アイデア': 0,
    '幸運': 0,
    '知識': 0
};

// ステータスとパラメータのラベル
const statusLabels = ["HP", "MP", "SAN", "ダメージボーナス", "イニシアティブ"];
const paramsLabels = ["STR", "CON", "POW", "DEX", "APP", "SIZ", "INT", "EDU"];

// DOMの読み込み完了後にヘッダー・フッターを読み込む
window.addEventListener("DOMContentLoaded", () => {
    ["header", "footer"].forEach(section =>
        loadComponent(`components/${section}.html`, `${section}-container`)
    );

    const btn = document.getElementById("scrollTopBtn");
    window.onscroll = function () {
        if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
            btn.style.display = "block";
        } else {
            btn.style.display = "none";
        }
    };
});

// トップにスクロールする関数
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * 指定されたHTMLファイルを指定のコンテナに挿入する
 * @param {string} path - 読み込むHTMLファイルのパス
 * @param {string} containerId - 挿入先の要素ID
 */
function loadComponent(path, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`Container with ID "${containerId}" not found.`);
        return;
    }

    fetch(path)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(html => {
            container.innerHTML = html;
        })
        .catch(error => console.error(`Failed to load component from ${path}:`, error));
}

/**
 * パラメータリストから指定ラベルの数値を取得する
 * @param {Array<{label: string, value: string}>} params - パラメータ配列
 * @param {string} label - 取得したいパラメータのラベル
 * @returns {number} - 対応する数値、見つからなければ0
 */
function getCharacterStatus(params, label) {
    const found = params.find(p => p.label === label);
    return found ? Number.parseInt(found.value, 10) || 0 : 0;
}

/**
 * STRとSIZの合計値に応じたダメージボーナスを返す
 * @param {number} str - STR（筋力）
 * @param {number} siz - SIZ（体格）
 * @returns {string} - ダメージボーナス（例: "+1D6"）
 */
function getDamageBonus(str, siz) {
    const sum = str + siz;
    if (sum <= 12) return '-1D6';
    if (sum <= 16) return '-1D4';
    if (sum <= 24) return '+0';
    if (sum <= 32) return '+1D4';
    return '+1D6';
}

/**
 * ラベルコピー用アイコンのSVG文字列を返す（タグアイコン）
 * @returns {string}
 */
function getTagIconSvg() {
    return `
<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
  <path d="M20.59 13.41L10.59 3.41C10.21 3.03 9.7 2.83 9.17 2.83H4C2.9 2.83 2 3.73 2 4.83V10C2 10.53 2.21 11.04 2.59 11.41L12.59 21.41C13.37 22.19 14.63 22.19 15.41 21.41L20.59 16.24C21.37 15.46 21.37 14.2 20.59 13.41ZM7 7.83C6.45 7.83 6 7.38 6 6.83C6 6.28 6.45 5.83 7 5.83C7.55 5.83 8 6.28 8 6.83C8 7.38 7.55 7.83 7 7.83Z"/>
</svg>`.trim();
}
/**
 * コピー用アイコンのSVG文字列を返す
 * @returns {string}
 */
function getCopyIconSvg() {
    return `
<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14
             c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
</svg>`.trim();
}

/**
 * 再生用アイコンのSVG文字列を返す
 * @returns {string}
 */
function getPlayIconSvg() {
    return `
<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
    <path d="M8 5v14l11-7z"/>
</svg>`.trim();
}

function parseJson() {
    const input = document.getElementById('txtJsonInput').value;
    const output = document.getElementById('output');
    output.innerHTML = '';

    let json;
    try {
        json = JSON.parse(input);
    } catch (e) {
        output.innerHTML = "<p>⚠️ JSONの形式が正しくありません。</p>";
        return;
    }

    if (json.kind !== "character") {
        output.innerHTML = "<p>⚠️ characterデータではありません。</p>";
        return;
    }

    const data = json.data;
    const name = data.name || "名前不明";
    const url = data.externalUrl || null;
    const commands = data.commands?.split('\n') || [];

    const params = extractParams(data.params);
    const status = extractStatus(data.status, params);

    applyBaseSkillModifiers(params);

    const statusRow = buildLabelValueRow(statusLabels, status);
    const paramsRow = buildLabelValueRow(paramsLabels, params);

    renderCharacterData(output, name, url, statusRow, paramsRow, commands);

    const radarChart = generateChart(paramsLabels, params);
    setupParamsInputListeners(paramsRow, radarChart);

    registerChartPlugins();
    setupCopyTabButtons(statusRow, paramsRow);
    setupCommandsTable();
}

function extractParams(paramList) {
    return paramsLabels.map(label => getCharacterStatus(paramList, label));
}

function extractStatus(statusList, params) {
    const [str, , pow, dex, , siz, , edu] = params;
    return [
        getCharacterStatus(statusList, 'HP'),
        getCharacterStatus(statusList, 'MP'),
        getCharacterStatus(statusList, 'SAN'),
        getDamageBonus(str, siz),
        dex
    ];
}

function applyBaseSkillModifiers(params) {
    const [, , pow, dex, , , int, edu] = params;
    baseSkills['幸運'] = Math.min(pow * 5);
    baseSkills['アイデア'] = Math.min(int * 5);
    baseSkills['知識'] = Math.min(edu * 5);
    baseSkills['回避'] = Math.min(dex * 2);
    baseSkills['母国語'] = Math.min(edu * 5);
}

function buildLabelValueRow(labels, values) {
    return labels.map((label, i) => ({ label, value: values[i] }));
}

function renderCharacterData(container, name, url, statusRow, paramsRow, commands) {
    const html = [
        generateBasicInfoHtml(name, url),
        generateStatusHtml(statusRow),
        generateParamsHtml(paramsRow, name),
        generateCommandsHtml(commands)
    ].join('');
    container.innerHTML = html;
}

function setupParamsInputListeners(paramsRow, radarChart) {
    paramsRow.forEach((p, i) => {
        const input = document.getElementById(`paramsValue-${i}`);
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
}

function registerChartPlugins() {
    Chart.register(createRadarBackgroundPlugin('rgba(212, 213, 205, 1)'));
    Chart.register(createCenteredPointLabelsPlugin());
}

function setupCopyTabButtons(statusRow, paramsRow) {
    setupCopyTabBtn(
        statusRow,
        document.getElementById('copyStatusTabBtn'),
        document.getElementById('toggleStatusCopyMode'),
        "ステータスを一括コピーしました"
    );

    setupCopyTabBtn(
        paramsRow,
        document.getElementById('copyParamsTabBtn'),
        document.getElementById('toggleParamsCopyMode'),
        "パラメータを一括コピーしました"
    );
}

/**
 * 入力欄と出力結果をクリアする
 */
function clearInput() {
    const input = document.getElementById("txtJsonInput");
    const output = document.getElementById("output");

    if (input) input.value = "";
    if (output) output.innerHTML = "";

}

/**
 * レーダーチャートを生成する
 * @param {string[]} labels - パラメータのラベル配列
 * @param {number[]} values - パラメータの値配列
 * @returns {Chart} - Chart.js レーダーチャートインスタンス
 */
function generateChart(labels, values) {
    const canvas = document.getElementById("paramRadarChart");
    if (!canvas) {
        console.error("レーダーチャート用のキャンバス要素が見つかりません。");
        return null;
    }

    return new Chart(canvas, {
        type: "radar",
        data: {
            labels,
            datasets: [{
                label: "",
                data: values,
                backgroundColor: "rgba(90, 92, 247, 0.5)",
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
                    ticks: {
                        stepSize: 1,
                        display: false
                    },
                    pointLabels: {
                        display: false
                    },
                    angleLines: {
                        color: "#fff",
                        lineWidth: 3
                    },
                    grid: {
                        color: "transparent"
                    }
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
                radarBackgroundPlugin: {},
                centeredPointLabels: {}
            },
            elements: {
                line: {
                    borderWidth: 2,
                    fill: true
                },
                point: {
                    radius: 0
                }
            },
            layout: {
                padding: 80
            }
        }
    });
}
/**
 * 基本情報のHTMLを生成する
 * @param {string} name - キャラクター名
 * @returns {string} - HTML文字列
 */
function generateBasicInfoHtml(name, url) {

    let linkHtml = '';

    if (url) {
        linkHtml = `
            <div>
                <a href="${url}" class="custom-link" target="_blank" rel="noopener noreferrer"> ▶ キャラクターシートを開く</a>
            </div>`;
    }

    return `
<div class="background-wrapper">
  <div class="section">
    <div class="section-header">
      <h2><i class="fas fa-user"></i>基本情報</h2>
      <div class="section-ctrl">
        ${linkHtml}
      </div>
    </div>
    <div class="section-body">
      <div class="section-body-fullwidth">
        <div class="field">
          <div class="label">名前</div>
          <div class="value-container">
            <input type="text" class="text-language" id="charName" value="${escapeHtml(name)}"/>
            <button class="copy-btn" onclick="copyToClipboard('charName','名前をコピーしました')" title="コピー">
              ${getCopyIconSvg()}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="section-footer"></div>
  </div>
</div>`;
}

/**
 * ステータス情報のHTMLを生成する
 * @param {Array<{label: string, value: string | number}>} row - ラベルと値の配列
 * @returns {string} - HTML文字列
 */
function generateStatusHtml(row) {
    const statusFieldsHtml = row.map((s, i) => `
      <div class="field">
        <div class="label">${escapeHtml(s.label)}</div>
        <div class="value-container">
          <input type="text" class="text-nummber" id="statusValue-${i}" value="${escapeHtml(s.value)}"/>
          <button class="copy-btn" onclick="copyToClipboard('statusValue-${i}','値をコピーしました')" title="コピー">
            ${getCopyIconSvg()}
          </button>
        </div>
      </div>
    `).join("");

    return `
<div class="background-wrapper">
  <div class="section">
    <div class="section-header">
      <h2><i class="fas fa-heartbeat"></i> ステータス</h2>
      <div class="section-ctrl">
        <button class="copy-btn copy-btn-long" id="copyStatusTabBtn">一括コピー(列)</button>
        <label class="toggle-switch">
          <input type="checkbox" id="toggleStatusCopyMode">
          <span class="slider"></span>
        </label>
      </div>
    </div>
    <div class="section-body">
      <div class="section-body-fullwidth">
        ${statusFieldsHtml}
      </div>
    </div>
    <div class="section-footer"></div>
  </div>
</div>`;
}

/**
 * パラメータ情報のHTMLを生成する
 * @param {Array<{label: string, value: number|string}>} row - ラベルと値の配列
 * @param {string} name - キャラクター名（画像保存時に使用）
 * @returns {string} - HTML文字列
 */
function generateParamsHtml(row, name) {
    const paramsFieldsHtml = row.map((s, i) => `
      <div class="field">
        <div class="label">${escapeHtml(s.label)}</div>
        <div class="value-container">
          <input type="text" class="text-nummber" id="paramsValue-${i}" value="${escapeHtml(s.value)}" />
          <button class="copy-btn" onclick="copyToClipboard('paramsValue-${i}', '値をコピーしました')" title="コピー">
            ${getCopyIconSvg()}
          </button>
        </div>
      </div>
    `).join("");

    return `
<div class="background-wrapper">
  <div class="section">
    <div class="section-header">
      <h2><i class="fas fa-chart-area"></i>パラメータ</h2>
      <div class="section-ctrl">
        <button class="copy-btn" id="copyParamsTabBtn">一括コピー(列)</button>
        <label class="toggle-switch">
          <input type="checkbox" id="toggleParamsCopyMode">
          <span class="slider"></span>
        </label>
      </div>
    </div>
    <div class="section-body">
      <div class="section-body-left">
        <div class="label">レーダーチャート</div>
        <div class="param-chart-wrapper">
          <button class="download-btn" onclick="downloadRadarChartImage('${escapeHtml(name)}')" title="レーダーチャートを画像として保存">
            <i class="fas fa-download"></i>
          </button>
          <canvas id="paramRadarChart" width="480" height="480"></canvas>
        </div>
      </div>
      <div class="section-body-right">
        ${paramsFieldsHtml}
      </div>
    </div>
    <div class="section-footer"></div>
  </div>
</div>`;
}

/**
 * コマンド一覧のHTMLを生成する
 * @param {Array} commands - コマンド配列
 * @returns {string} - HTML文字列
 */
function generateCommandsHtml(commands) {
    const commandList = formatCommandList(commands);

    return `
<div class="background-wrapper">
  <div class="section">
    <div class="section-header">
      <h2><i class="fas fa-list-alt"></i>コマンド一覧</h2>
      <div class="section-ctrl">
        <button class="copy-btn" id="copyCommandsAllBtn">一括コピー(技能名：判定値)</button>
        <label class="toggle-switch">
          <input type="checkbox" id="toggleCommandCopyMode">
          <span class="slider"></span>
        </label>
      </div>
    </div>
    <div class="section-body">
      <div class="section-body-fullwidth">
        <div class="field">
          <div class="label">タイプ</div>
          <div class="value-container">
            <select id="filterType" class="text-language">
              <option value="">すべて</option>
              <option value="技能" selected="true">技能</option>
              <option value="初期値技能">初期値技能</option>
              <option value="パラメータ">パラメータ</option>
              <option value="ダメージ判定">ダメージ判定</option>
            </select>
          </div>
        </div>
        <div class="field">
          <div class="label">技能名</div>
          <div class="value-container">
            <input type="text" class="text-language" id="filterName" list="skillList" placeholder="技能名を入力（あいまい）" />
            <datalist id="skillList"></datalist>
            <div class="checkbox">
              <input type="checkbox" id="filterThreeMajorSkills" />
              <label for="filterThreeMajorSkills">三大探索技能のみ</label>
            </div>
          </div>
        </div>
        <div class="field">
          <div class="label">判定値</div>
          <div class="value-container">
            <input type="number" class="text-nummber" id="filterValueMin" placeholder="下限" min="0" pattern="[0-9]*"/>
            〜
            <input type="number" class="text-nummber" id="filterValueMax" placeholder="上限" min="1" pattern="[0-9]*"/>
          </div>
        </div>
        <div class="field">
          <div class="button-group-with-summary">
            <div id="filterSummary" class="filter-summary" aria-hidden="true"></div>
            <button id="clearFiltersBtn" class="btn btn-large btn-no">クリア</button>
          </div>
        </div>
      </div>
    </div>
    <div class="section-footer">
      <div id="commandsTableContainer">
        <table id="commandsTable" border="1" cellspacing="0" cellpadding="4">
          <thead>
            <tr>
              <th data-sort="type" style="cursor:pointer;">タイプ　▲▼</th>
              <th data-sort="label" style="cursor:pointer;">技能名　▲▼</th>
              <th data-sort="value" style="cursor:pointer;">判定値　▲▼</th>
              <th data-sort="origValue" style="cursor:pointer;">コマンド　▲▼</th>
              <th>コピー</th>
            </tr>
          </thead>
          <tbody>
            ${commandList.map(row => `
              <tr data-type="${escapeHtml(row.type)}">
                <td>${escapeHtml(row.type)}</td>
                <td>${escapeHtml(row.label)}</td>
                <td>${escapeHtml(row.showValue)}</td>
                <td>${escapeHtml(row.origValue)}</td>
                <td>
                  <button class="copy-btn-label" data-copy-text="${escapeHtml(row.label)}" title="技能名">
                    ${getTagIconSvg()}
                  </button>
                  <button class="copy-btn" data-copy-text="${escapeHtml(row.label)}：${escapeHtml(row.showValue)}" title="技能名：判定値">
                    ${getCopyIconSvg()}
                  </button>
                  <button class="copy-btn-cmd" data-copy-text="${escapeHtml(row.origValue)}" title="コマンド">
                    ${getPlayIconSvg()}
                  </button>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>`;
}

/**
 * コマンド文字列の配列を整形し、各コマンドに分類と表示用の値を付加する
 * @param {string[]} commands - 生のコマンド文字列配列
 * @returns {Array} 整形済みコマンドオブジェクトの配列
 */
function formatCommandList(commands) {
    return commands
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => {
            const spIdx = line.indexOf(" ");
            let value = spIdx < 0 ? line : line.slice(0, spIdx);
            let label = spIdx < 0 ? "" : line.slice(spIdx + 1);

            // ラベルの調整
            label = label.replace(/（パンチ）/g, "")
                .replace(/（([^）]*)）/g, (match, p1) => p1.trim() === "" ? "" : `（${p1}）`)
                .replace(/[【】]/g, "")
                .trim();

            return {
                origValue: line,
                value,
                label,
                type: null,
                showValue: null
            };
        })
        .map(c => {
            // typeの判定
            if (c.label.includes("正気度ロール") || paramsLabels.some(pn => c.label.includes(pn))) {
                c.type = "パラメータ";
            } else if (!/^(CCB<=|sCCB<=|CC<=)/i.test(c.value)) {
                c.type = "ダメージ判定";
            } else {
                const key = findInitialKey(c.label);
                if (key === null) {
                    c.type = "技能";
                } else {
                    const baseVal = baseSkills[key];
                    if (baseVal == null) {
                        c.type = "技能";
                    } else if (c.value.includes("=")) {
                        const rightSide = extractValueRightSide(c.value);
                        const valNum = extractValueNumber(rightSide);
                        if (valNum === null) {
                            c.type = "技能";
                        } else {
                            c.type = (valNum === baseVal) ? "初期値技能" : "技能";
                        }
                    } else {
                        c.type = "技能";
                    }
                }
            }

            // showValueの設定
            if (c.type === "ダメージ判定") {
                c.showValue = c.value;
            } else if (["パラメータ", "初期値技能", "技能"].includes(c.type)) {
                c.showValue = c.value.includes("=") ? extractValueRightSide(c.value) : c.value;
            } else {
                c.showValue = c.value;
            }

            return c;
        });
}

function extractValueRightSide(val) {
    const idx = val.indexOf("=");
    return idx < 0 ? "" : val.slice(idx + 1);
}

function extractValueNumber(val) {
    const match = val.match(/\d+/);
    return match ? Number(match[0]) : null;
}

function findInitialKey(label) {
    // baseSkillsのキーの中で、labelが始まるもののうち最長のキーを返す
    return Object.keys(baseSkills).reduce((foundKey, key) => {
        if (label.startsWith(key) && key.length > (foundKey?.length || 0)) {
            return key;
        }
        return foundKey;
    }, null);
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[char]);
}

function setupCommandsTable() {
    const filterType = document.getElementById('filterType');
    const filterName = document.getElementById('filterName');
    const filterValueMin = document.getElementById('filterValueMin');
    const filterValueMax = document.getElementById('filterValueMax');
    const filterThreeMajor = document.getElementById('filterThreeMajorSkills');
    const table = document.getElementById('commandsTable');
    if (!table) return;

    const tbody = table.querySelector('tbody');
    const allRows = Array.from(tbody.querySelectorAll('tr'));
    const threeMajorSkills = ['聞き耳', '目星', '図書館'];

    // フィルタ条件チェック関数群
    const isThreeMajorSkill = name => threeMajorSkills.some(skill => name.includes(skill));
    const matchValueRange = (val, min, max, excludeDice) => {
        const valStr = val.trim();
        const numeric = Number(valStr);
        const isNumeric = !isNaN(numeric) && /^-?\d+(\.\d+)?$/.test(valStr);
        if (isNumeric) {
            if (min !== null && numeric < min) return false;
            if (max !== null && numeric > max) return false;
            return true;
        }
        return !excludeDice;
    };

    // 行のフィルタリング
    function filterRows() {
        const selectedType = filterType.value;
        const nameKeyword = filterName.value.trim().toLowerCase();
        const onlyThreeMajor = filterThreeMajor.checked;
        const minVal = filterValueMin.value ? Number(filterValueMin.value) : null;
        const maxVal = filterValueMax.value ? Number(filterValueMax.value) : null;
        const excludeDice = minVal !== null || maxVal !== null;

        allRows.forEach(row => {
            const type = row.getAttribute('data-type');
            const name = row.cells[1].innerText.trim();
            const value = row.cells[2].innerText.trim();

            let visible = true;
            if (selectedType && selectedType !== type) visible = false;
            if (nameKeyword && !name.toLowerCase().includes(nameKeyword)) visible = false;
            if (!matchValueRange(value, minVal, maxVal, excludeDice)) visible = false;
            if (onlyThreeMajor && !isThreeMajorSkill(name)) visible = false;

            row.style.display = visible ? '' : 'none';
        });

        updateSkillListDatalist();

        const datalist = document.getElementById('skillList');

        filterName.addEventListener('input', () => {
            const selectedValue = filterName.value;
            const options = Array.from(datalist.options).map(opt => opt.value);

            if (options.includes(selectedValue)) {
                setTimeout(() => {
                    filterName.blur();
                }, 100);
            }
        });
    }

    // ソート処理
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

            // 数値かどうかの判定を統一化
            const aNum = Number(aText);
            const bNum = Number(bText);
            const aIsNum = !isNaN(aNum);
            const bIsNum = !isNaN(bNum);

            if (aIsNum && bIsNum) {
                return asc ? aNum - bNum : bNum - aNum;
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

    // コピー用ボタン共通イベント登録関数
    function setupCopyButtons(selector, toastMessage) {
        table.querySelectorAll(selector).forEach(btn => {
            btn.addEventListener('click', () => {
                const text = btn.getAttribute('data-copy-text');
                if (!text) return;
                navigator.clipboard.writeText(text).then(() => {
                    const toast = document.getElementById("toast");
                    if (!toast) return;
                    toast.textContent = toastMessage;
                    toast.classList.add("show");
                    setTimeout(() => toast.classList.remove("show"), 1000);
                }).catch(() => alert('コピーに失敗しました'));
            });
        });
    }

    setupCopyButtons('button.copy-btn[data-copy-text]', '「技能名：判定値」をコピーしました');
    setupCopyButtons('button.copy-btn-label[data-copy-text]', '「技能名」をコピーしました');
    setupCopyButtons('button.copy-btn-cmd[data-copy-text]', '「コマンド」をコピーしました');

    // フィルターのinput/changeイベント
    [filterType, filterName, filterValueMin, filterValueMax, filterThreeMajor].forEach(el => {
        el.addEventListener('input', filterRows);
        el.addEventListener('change', filterRows);
    });

    // フィルタークリアボタン
    document.getElementById('clearFiltersBtn').addEventListener('click', () => {
        filterType.value = '';
        filterName.value = '';
        filterValueMin.value = '';
        filterValueMax.value = '';
        filterThreeMajor.checked = false;
        updateFilterSummary();
        filterRows();
    });

    // 一括コピー切替＆実行
    const copyAllBtn = document.getElementById('copyCommandsAllBtn');
    const toggle = document.getElementById('toggleCommandCopyMode');
    const msg = "コマンドを一括コピーしました";

    if (!copyAllBtn || !toggle) return;

    const updateButtonLabel = () => {
        copyAllBtn.innerText = toggle.checked ? "一括コピー(コマンド)" : "一括コピー(技能名：判定値)";
    };
    toggle.addEventListener('change', updateButtonLabel);
    updateButtonLabel();

    copyAllBtn.addEventListener('click', () => {
        const visibleRows = allRows.filter(row => row.style.display !== 'none');
        const lines = visibleRows.map(row => {
            const selector = toggle.checked ? 'button.copy-btn-cmd' : 'button.copy-btn';
            const btn = row.querySelector(selector);
            return btn ? btn.getAttribute('data-copy-text') : '';
        }).filter(Boolean);

        navigator.clipboard.writeText(lines.join('\n')).then(() => {
            const toast = document.getElementById("toast");
            if (!toast) return;
            toast.textContent = msg;
            toast.classList.add("show");
            setTimeout(() => toast.classList.remove("show"), 1000);
        });
    });

    // 初期フィルター＆ソート
    filterRows();
    sortTableByKey('value', false);

    // 検索条件バッチ
    ['filterType', 'filterName', 'filterThreeMajorSkills', 'filterValueMin', 'filterValueMax'].forEach(id => {
        document.getElementById(id).addEventListener('input', updateFilterSummary);
        document.getElementById(id).addEventListener('change', updateFilterSummary);
    });
}

// 共通: トースト表示
function showToast(message, duration = 1000) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), duration);
}

function createRadarBackgroundPlugin(fillColor = 'rgba(212, 213, 205, 1)') {
    return {
        id: 'radarBackgroundPlugin',
        beforeDraw(chart) {
            const { ctx, scales } = chart;
            const rScale = scales.r;
            if (!rScale) return;

            const centerX = rScale.xCenter;
            const centerY = rScale.yCenter;
            const radius = rScale.drawingArea;
            const pointCount = rScale._pointLabels.length;

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

function createCenteredPointLabelsPlugin({
    fontSize = 22,
    fontFamily = 'Roboto',
    fontColor = '#444',
    offset = 40,
    lineHeight = 30
} = {}) {
    return {
        id: 'centeredPointLabels',
        afterDraw(chart) {
            const { ctx, scales, data } = chart;
            const rScale = scales.r;
            if (!rScale) return;

            const labels = data.labels || [];
            const values = (data.datasets?.[0]?.data) || [];

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

function downloadRadarChartImage(name = "キャラクター") {
    const canvas = document.getElementById("paramRadarChart");
    if (!canvas) {
        alert("チャートがまだ表示されていません");
        return;
    }
    const safeName = name.replace(/[\\/:*?"<>|]/g, "_");
    const a = document.createElement("a");
    a.download = `${safeName}_レーダーチャート.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
}

function setupCopyTabBtn(data, btn, toggle, msg) {
    if (!btn || !toggle) return;

    const updateButtonLabel = () => {
        btn.innerText = toggle.checked ? "一括コピー(行)" : "一括コピー(列)";
    };

    toggle.addEventListener('change', updateButtonLabel);
    updateButtonLabel();

    btn.addEventListener('click', () => {
        const text = toggle.checked
            ? `${data.map(p => p.label).join('\t')}\n${data.map(p => p.value).join('\t')}`
            : data.map(p => `${p.label}\t${p.value}`).join('\n');

        navigator.clipboard.writeText(text).then(() => {
            showToast(msg);
        });
    });
}

function copyToClipboard(elementId, label = "コピーしました") {
    const el = document.getElementById(elementId);
    if (!el) return;

    const text = ['INPUT', 'TEXTAREA'].includes(el.tagName) ? el.value : el.innerText;

    navigator.clipboard.writeText(text).then(() => {
        showToast(label);
    });
}

async function pasteFromClipboard(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;

    try {
        const text = await navigator.clipboard.readText();
        document.getElementById(elementId).value = text;
    } catch (err) {
        console.error('クリップボードからの読み取りに失敗しました:', err);
    }

}

function updateFilterSummary() {
    const type = document.getElementById('filterType').value;
    const name = document.getElementById('filterName').value.trim();
    const threeMajor = document.getElementById('filterThreeMajorSkills').checked;
    const min = document.getElementById('filterValueMin').value;
    const max = document.getElementById('filterValueMax').value;

    const summaryBox = document.getElementById('filterSummary');
    const summary = [];

    if (type) summary.push(`[ タイプ：${type} ]`);
    if (name) summary.push(`[ 技能名：${name} ]`);
    if (threeMajor) summary.push(`[ 三大探索技能のみ ]`);
    if (min || max) summary.push(`[ 判定値：${min || '0'}〜${max || ''} ]`);

    if (summary.length) {
        summaryBox.textContent = `現在の検索条件　${summary.join('　/　')}`;
        summaryBox.classList.remove('hidden');
    } else {
        summaryBox.textContent = '';
        summaryBox.classList.add('hidden');
    }
}

function updateSkillListDatalist() {
    const tbody = document.querySelector('#commandsTable tbody');
    const skillListDatalist = document.getElementById('skillList');

    const skillNames = Array.from(tbody.querySelectorAll('tr'))
        .filter(row => row.style.display !== 'none')
        .map(row => row.cells[1].textContent.trim())
        .filter(name => name.length > 0);

    const uniqueSkillNames = [...new Set(skillNames)];

    skillListDatalist.innerHTML = '';
    uniqueSkillNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        skillListDatalist.appendChild(option);
    });
}