import * as utility from './utility.js';


const BASE_SKILLS = {
    '威圧': 15,
    '言いくるめ': 5,
    '医学': 1,
    '運転': 20,
    '応急手当': 30,
    'オカルト': 5,
    '隠密': 20,
    '科学': 1,
    '鍵開け': 1,
    '勘定': 5,
    '機械修理': 10,
    '聞き耳': 20,
    '近接戦闘（格闘）': 20,
    'クトゥルフ神話': 0,
    '芸術／製作': 5,
    '経理': 5,
    '考古学': 1,
    'コンピューター': 5,
    'サバイバル': 10,
    '自然': 10,
    '射撃（拳銃）': 20,
    '射撃（ライフル／ショットガン）': 25,
    '重機械操作': 1,
    '乗馬': 5,
    '心理学': 10,
    '人類学': 1,
    '水泳': 20,
    '精神分析': 1,
    '説得': 10,
    '操縦': 1,
    '跳躍': 20,
    '追跡': 10,
    '手さばき': 10,
    '電気修理': 10,
    '電子工学': 1,
    '投擲': 20,
    '登攀': 20,
    '図書館': 20,
    'ナビゲート': 10,
    '変装': 5,
    '法律': 5,
    'ほかの言語': 1,
    '目星': 25,
    '魅惑': 15,
    '歴史': 5,
    '回避': 0,
    '母国語': 0,
    'アイデア': 0,
    '幸運': 0,
    '知識': 0,
    '信用': 0,
};

const BASIC_STATUS = [
    { label: "HP", min: 6, max: 20 },
    { label: "MP", min: 3, max: 20 },
    { label: "SAN", min: 15, max: 90 },
    { label: "DB", min: "-2", max: "+1D6" },
    { label: "ビルド", min: "-2", max: "2" },
    { label: "MOV", min: 5, max: 9 },
    { label: "幸運", min: 15, max: 90 }
];

const BASIC_PARAMS = [
    { label: "STR", min: 15, max: 90 },
    { label: "CON", min: 15, max: 90 },
    { label: "POW", min: 15, max: 90 },
    { label: "DEX", min: 15, max: 90 },
    { label: "APP", min: 15, max: 90 },
    { label: "SIZ", min: 40, max: 90 },
    { label: "INT", min: 40, max: 90 },
    { label: "EDU", min: 40, max: 90 }
];

window.addEventListener("DOMContentLoaded", () => {
    bindInitEventHandlers();
});

function bindInitEventHandlers() {
    const btnPaste = document.getElementById('btnJsonPaste');
    const btnParse = document.getElementById('btnJsonParse');
    const btnClear = document.getElementById('btnJsonClear');
    const scrollBtn = document.getElementById('scrollTopBtn');

    if (btnPaste) {
        btnPaste.addEventListener('click', () => pasteFromClipboard('txtJsonInput'));
    }

    if (btnParse) {
        btnParse.addEventListener('click', () => {
            parseJson();
            updateFilterSummary();
        });
    }

    if (btnClear) {
        btnClear.addEventListener('click', () => clearInput());
    }

    if (scrollBtn) {
        scrollBtn.addEventListener('click', () => utility.scrollToTop());
        window.onscroll = function () {
            if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
                scrollBtn.style.display = "block";
            } else {
                scrollBtn.style.display = "none";
            }
        };
    }
}

function getCharacterStatus(params, label) {
    const found = params.find(p => p.label === label);
    return found ? Number.parseInt(found.value, 10) || 0 : 0;
}

function getDamageBonus(str, siz) {
    const total = str + siz;

    if (total <= 64) return '-2';
    if (total <= 84) return '-1';
    if (total <= 124) return '±0';
    if (total <= 164) return '+1D4';
    if (total <= 204) return '+1D6';

    const over = total - 125;
    const bonusDice = 2 + Math.floor(over / 40);
    return `+${bonusDice}D6`;
}

function getBuild(str, siz) {
    const total = str + siz;

    if (total <= 64) return -2;
    if (total <= 84) return -1;
    if (total <= 124) return 0;
    if (total <= 164) return 1;
    if (total <= 204) return 2;

    const over = total - 125;
    return 3 + Math.floor(over / 40);
}

function getMove(str, dex, siz) {

    if (str > siz && dex > siz) {
        return 9;
    } else if (str < siz && dex < siz) {
        return 7;
    } else {
        return 8;
    }
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
    const commands = data.commands ?.split('\n') || [];

    const params = extractParams(data.params);
    const status = extractStatus(data.status, params, commands);

    applyBaseSkillModifiers(params);

    const statusRow = buildLabelValueRow(BASIC_STATUS, status);
    const paramsRow = buildLabelValueRow(BASIC_PARAMS, params);

    renderCharacterData(output, name, url, statusRow, paramsRow, commands);

    const dynamicMaxValues = params.map((val, i) =>
        Math.max(val, BASIC_PARAMS[i].max)
    );

    const normalizedParams = params.map((val, i) =>
        normalizeValue(val, 0, dynamicMaxValues[i])
    );

    const radarChart = generateChart(
        BASIC_PARAMS.map(attr => attr.label),
        normalizedParams,
        params,
        dynamicMaxValues
    );

    setupParamsInputListeners(paramsRow, radarChart);

    registerChartPlugins(params, dynamicMaxValues);
    setupCopyTabButtons(statusRow, paramsRow);
    setupCommandsTable();
}

function clearInput() {
    const input = document.getElementById("txtJsonInput");
    const output = document.getElementById("output");

    if (input) input.value = "";
    if (output) output.innerHTML = "";

}

function extractParams(paramList) {
    return BASIC_PARAMS.map(attr => getCharacterStatus(paramList, attr.label));
}

function extractStatus(statusList, params, commands) {
    const [str, , pow, dex, , siz, , edu] = params;
    const luck = extractLuck(statusList, commands);
    const movStatus = statusList.find(s => s.label === "MOV");
    const mov = movStatus ? parseInt(movStatus.value, 10) : getMove(str, dex, siz);

    return [
        getCharacterStatus(statusList, 'HP'),
        getCharacterStatus(statusList, 'MP'),
        getCharacterStatus(statusList, 'SAN'),
        getDamageBonus(str, siz),
        getBuild(str, siz),
        mov,
        luck
    ];
}

function extractLuck(statusList, commandList) {

    const luckStatus = statusList?.find(s => s.label === "幸運");
    if (luckStatus && !isNaN(parseInt(luckStatus.value))) {
        return parseInt(luckStatus.value, 10);
    }

    for (const cmd of commandList) {
        const match = cmd.match(/CC<=\s*(\d+)\s*(?:幸運|【幸運】)/);
        if (match) {
            return parseInt(match[1], 10);
        }
    }

    return 0;
}

function normalizeValue(value, min, max) {
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

function applyBaseSkillModifiers(params) {
    const [, , pow, dex, , , int, edu] = params;
    BASE_SKILLS['幸運'] = Math.min(pow * 5);
    BASE_SKILLS['アイデア'] = Math.min(int * 5);
    BASE_SKILLS['知識'] = Math.min(edu * 5);
    BASE_SKILLS['回避'] = Math.min(dex * 2);
    BASE_SKILLS['母国語'] = Math.min(edu * 5);
}

function buildLabelValueRow(attributes, values) {
    return attributes.map((attr, i) => ({
        label: attr.label,
        value: values[i]
    }));
}

function renderCharacterData(container, name, url, statusRow, paramsRow, commands) {
    const html = [
        generateBasicInfoHtml(name, url),
        generateStatusHtml(statusRow),
        generateParamsHtml(paramsRow, name),
        generateCommandsHtml(commands)
    ].join('');
    container.innerHTML = html;
    bindDynamicEventHandlers(container);
}

function bindDynamicEventHandlers(container) {
    container.querySelectorAll('.copy-btn[data-copy-target]').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.copyTarget;
            const message = btn.dataset.copyMsg || 'コピーしました';
            copyToClipboard(targetId, message);
        });
    });

    container.querySelectorAll('.download-btn[data-download-name]').forEach(btn => {
        btn.addEventListener('click', () => {
            const name = btn.dataset.downloadName;
            downloadRadarChartImage(name);
        });
    });

    container.querySelectorAll('[data-copy-text]').forEach(btn => {
        btn.addEventListener('click', () => {
            const text = btn.dataset.copyText;
            navigator.clipboard.writeText(text).then(() => {
                showToast("コピーしました");
            });
        });
    });
}

function setupParamsInputListeners(paramsRow, radarChart) {
    paramsRow.forEach((p, i) => {
        const input = document.getElementById(`paramsValue-${i}`);
        if (input) {
            input.addEventListener('blur', () => {
                let val = Number(input.value);
                if (isNaN(val)) return;

                const { min, max: baseMax } = BASIC_PARAMS[i];

                const dynamicMax = Math.max(val, baseMax);

                radarChart.data.datasets[0].data[i] = normalizeValue(val, 0, dynamicMax);
                radarChart.options.plugins.centeredPointLabels.rawValues[i] = val;
                radarChart.options.plugins.centeredPointLabels.dynamicMaxValues[i] = dynamicMax;

                radarChart.update();
            });
        }
    });
}

function registerChartPlugins(rawValues, dynamicMaxValues) {
    Chart.register(createRadarBackgroundPlugin('rgba(212, 213, 205, 1)'));
    Chart.register(createCenteredPointLabelsPlugin({
        BASIC_PARAMS,
        rawValues,
        dynamicMaxValues
    }));
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

function generateChart(labels, normalizedValues, rawValues, dynamicMaxValues) {
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
                data: normalizedValues,
                backgroundColor: "rgba(90, 92, 247, 0.5)",
                borderWidth: 0,
                pointBackgroundColor: "transparent"
            }]
        },
        options: {
            responsive: false,
            scales: {
                r: {
                    min: 0,
                    max: 1,
                    ticks: {
                        stepSize: 0.01,
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
                        label: ctx => {
                            const i = ctx.dataIndex;
                            return `${labels[i]}: ${rawValues[i]} (max: ${dynamicMaxValues[i]})`;
                        }
                    }
                },
                radarBackgroundPlugin: {},
                centeredPointLabels: {
                    BASIC_PARAMS,
                    rawValues,
                    dynamicMaxValues
                }
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
            <input type="text" class="text-language" id="charName" value="${utility.escapeHtml(name)}"/>
            <button class="copy-btn" data-copy-target="charName" data-copy-msg="名前をコピーしました" title="コピー">
              ${utility.getCopyIconSvg()}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="section-footer"></div>
  </div>
</div>`;
}

function generateStatusHtml(row) {
    const statusFieldsHtml = row.map((s, i) => `
      <div class="field">
        <div class="label">${utility.escapeHtml(s.label)}</div>
        <div class="value-container">
          <input type="text" class="text-nummber" id="statusValue-${i}" value="${utility.escapeHtml(s.value)}"/>
          <button class="copy-btn" data-copy-target="statusValue-${i}" data-copy-msg="値をコピーしました" title="コピー">
            ${utility.getCopyIconSvg()}
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

function generateParamsHtml(row, name) {
    const paramsFieldsHtml = row.map((s, i) => `
      <div class="field">
        <div class="label">${utility.escapeHtml(s.label)}</div>
        <div class="value-container">
          <input type="number" class="text-nummber" id="paramsValue-${i}" value="${utility.escapeHtml(s.value)}" />
          <button class="copy-btn" data-copy-target="paramsValue-${i}" data-copy-msg="値をコピーしました" title="コピー">
            ${utility.getCopyIconSvg()}
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
          <button class="download-btn" data-download-name="${utility.escapeHtml(name)}" title="レーダーチャートを画像として保存">
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
              <tr data-type="${utility.escapeHtml(row.type)}">
                <td>${utility.escapeHtml(row.type)}</td>
                <td>${utility.escapeHtml(row.label)}</td>
                <td>${utility.escapeHtml(row.showValue)}</td>
                <td>${utility.escapeHtml(row.origValue)}</td>
                <td>
                  <button class="copy-btn-label" data-copy-text="${utility.escapeHtml(row.label)}" title="技能名">
                    ${utility.getTagIconSvg()}
                  </button>
                  <button class="copy-btn" data-copy-text="${utility.escapeHtml(row.label)}：${utility.escapeHtml(row.showValue)}" title="技能名：判定値">
                    ${utility.getCopyIconSvg()}
                  </button>
                  <button class="copy-btn-cmd" data-copy-text="${utility.escapeHtml(row.origValue)}" title="コマンド">
                    ${utility.getPlayIconSvg()}
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
            if (c.label.includes("正気度ロール") || BASIC_PARAMS.some(attr => c.label.includes(attr.label))) {
                c.type = "パラメータ";
            } else if (!/^(CCB<=|sCCB<=|CC<=)/i.test(c.value)) {
                c.type = "ダメージ判定";
            } else {
                const key = findInitialKey(c.label);
                if (key === null) {
                    c.type = "技能";
                } else {
                    const baseVal = BASE_SKILLS[key];
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
    // BASE_SKILLSのキーの中で、labelが始まるもののうち最長のキーを返す
    return Object.keys(BASE_SKILLS).reduce((foundKey, key) => {
        if (label.startsWith(key) && key.length > (foundKey ?.length || 0)) {
            return key;
        }
        return foundKey;
    }, null);
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
    lineHeight = 30,
    BASIC_PARAMS = [],
    rawValues = [],
    dynamicMaxValues = []
} = {}) {
    return {
        id: 'centeredPointLabels',
        afterDraw(chart, args, options) {
            const { ctx, scales, data } = chart;
            const rScale = scales.r;
            if (!rScale) return;

            const labels = data.labels || [];
            const values = options.rawValues || [];

            ctx.save();
            const centerX = rScale.xCenter;
            const centerY = rScale.yCenter;
            const radius = rScale.drawingArea;
            const count = labels.length;

            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 / count) * i - Math.PI / 2;
                const x = centerX + (radius + offset) * Math.cos(angle);
                const y = centerY + (radius + offset) * Math.sin(angle);

                const val = values[i];
                const dynMax = dynamicMaxValues[i] || BASIC_PARAMS[i] ?.max || 1;

                let labelColor = fontColor;
                if (val >= dynMax) labelColor = '#d32f2f';
                else if (val <= BASIC_PARAMS[i].min) labelColor = '#1976d2';

                ctx.fillStyle = labelColor;
                ctx.font = `${fontSize}px ${fontFamily}`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(labels[i], x, y - lineHeight / 2);
                ctx.fillText(val, x, y + lineHeight / 2);
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