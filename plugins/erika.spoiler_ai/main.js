// AI 防剧透，从 NipaPlay 移植：弹幕载入后把弹幕文本交给你配置的 AI 服务，
// 把它认为剧透的弹幕原样屏蔽。识别是辅助过滤，不保证完全准确；分析大量
// 弹幕会消耗额度和时间。

var MAX_TEXTS = 1200;
var MAX_PROMPT = 24000;

var pluginUIEntries = [
  { id: 'enabled', title: '启用防剧透', description: '先填好下面的接口并测试，再打开。', enabled: false },
  {
    id: 'format',
    title: '接口格式',
    description: 'openai：OpenAI 兼容接口，地址通常以 /v1/chat/completions 结尾；gemini：Google Gemini，地址可以只填到 /v1beta/models。',
    textSetting: { hintText: 'openai', default: 'openai' },
  },
  { id: 'url', title: 'API 地址', textSetting: { hintText: 'https://api.openai.com/v1/chat/completions', default: '' } },
  { id: 'key', title: 'API 密钥', description: '只保存在 Erika 里，不要写进截图或公开的问题。', textSetting: { hintText: 'sk-…', default: '' } },
  { id: 'model', title: '模型', textSetting: { hintText: 'gpt-5', default: 'gpt-5' } },
  { id: 'temperature', title: '温度', description: '0 到 2。', textSetting: { hintText: '0.5', default: '0.5' } },
  { id: 'debug', title: '调试打印', description: '把 AI 的原始回答和命中的弹幕写进日志；排查完请关掉。', enabled: false },
  { id: 'test', title: '测试接口', description: '用三条示例弹幕请求一次，看接口能不能用、返回了什么。' },
];

// What is hidden: each hit as an exact-match pattern, for the video playing.
var pluginBlockWords = [];
var running = 0;

function normalize(text) {
  return String(text == null ? '' : text).replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function escapePattern(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+');
}

function config() {
  var temperature = parseFloat(settings.getText('temperature'));
  return {
    format: (settings.getText('format') || 'openai').trim().toLowerCase(),
    url: settings.getText('url').trim(),
    key: settings.getText('key').trim(),
    model: (settings.getText('model') || 'gpt-5').trim(),
    temperature: isNaN(temperature) ? 0.5 : Math.min(2, Math.max(0, temperature)),
  };
}

function buildPrompt(texts) {
  var prompt = '将下面弹幕内容中你认为涉及剧透的弹幕文本原样返回给我，弹幕之间使用||分割，除了返还内容本身以外什么都不做：\n';
  for (var i = 0; i < texts.length; i++) {
    var line = texts[i] + '\n';
    if (prompt.length + line.length > MAX_PROMPT) break;
    prompt += line;
  }
  return prompt;
}

function geminiUrl(base, model, key) {
  var url = base.replace(/\/+$/, '');
  var lower = url.toLowerCase();
  if (lower.indexOf(':generatecontent') >= 0 || lower.indexOf(':streamgeneratecontent') >= 0) {
    // As given.
  } else if (/\/models$/.test(lower)) {
    url = url + '/' + model + ':generateContent';
  } else if (/\/v1beta$/.test(lower) || /\/v1$/.test(lower)) {
    url = url + '/models/' + model + ':generateContent';
  } else if (lower.indexOf('/models/') >= 0) {
    url = url + ':generateContent';
  } else {
    url = url + '/' + model + ':generateContent';
  }
  if (!/[?&]key=/.test(url)) url += (url.indexOf('?') >= 0 ? '&' : '?') + 'key=' + encodeURIComponent(key);
  return url;
}

// The text of an answer, in the shapes OpenAI, Gemini and others give it.
function answerText(body) {
  var trimmed = String(body || '').trim();
  try {
    var data = JSON.parse(trimmed);
    if (Array.isArray(data)) return data.map(String).join('||');
    var direct = data.content || data.text || data.result;
    if (typeof direct === 'string' && direct.trim()) return direct.trim();
    if (data.candidates && data.candidates.length) {
      var parts = (data.candidates[0].content || {}).parts || [];
      var joined = parts.map(function (part) { return part.text || ''; }).join('').trim();
      if (joined) return joined;
    }
    if (data.choices && data.choices.length) {
      var choice = data.choices[0];
      var content = choice.message && choice.message.content;
      if (typeof content === 'string' && content.trim()) return content.trim();
      if (typeof choice.text === 'string' && choice.text.trim()) return choice.text.trim();
    }
    if (data.output && data.output.length && data.output[0].content) {
      return data.output[0].content.map(function (part) { return part.text || ''; }).join('').trim();
    }
  } catch (error) {
    // Plain text.
  }
  return trimmed;
}

function unquote(text) {
  var t = text.trim();
  if (t.length >= 2 && ((t[0] === '"' && t[t.length - 1] === '"') || (t[0] === "'" && t[t.length - 1] === "'"))) {
    return t.slice(1, -1).trim();
  }
  return t;
}

// The comments the answer names.
function spoilersOf(raw) {
  var text = unquote(raw);
  if (!text) return [];
  if (text[0] === '[' || text[0] === '{') {
    try {
      var data = JSON.parse(text);
      var list = Array.isArray(data) ? data : data.spoilers || data.blocked || data.data;
      if (Array.isArray(list)) return list.map(function (item) { return String(item).trim(); }).filter(Boolean);
      if (typeof (data.content || data.text) === 'string') return spoilersOf(data.content || data.text);
    } catch (error) {
      // Not JSON after all.
    }
  }
  var separator = text.indexOf('||') >= 0 ? '||' : text.indexOf('\n') >= 0 ? '\n' : null;
  var items = separator ? text.split(separator) : [text];
  return items.map(unquote).filter(Boolean);
}

async function detect(texts) {
  var c = config();
  if (!c.url) throw new Error('还没有填写 API 地址');
  if (!c.key) throw new Error('还没有填写 API 密钥');
  var prompt = buildPrompt(texts);
  var headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  var response;
  if (c.format === 'gemini') {
    headers['x-goog-api-key'] = c.key;
    response = await net.fetch(geminiUrl(c.url, c.model, c.key), {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: c.temperature },
      }),
    });
  } else {
    headers.Authorization = /^bearer /i.test(c.key) ? c.key : 'Bearer ' + c.key;
    response = await net.fetch(c.url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ model: c.model, temperature: c.temperature, messages: [{ role: 'user', content: prompt }] }),
    });
  }
  if (response.status !== 200) throw new Error('AI 请求失败：HTTP ' + response.status);
  var raw = answerText(response.body);
  if (settings.getSwitch('debug')) dev.log('[防剧透] AI 回答：' + raw.slice(0, 8000));
  return spoilersOf(raw);
}

async function analyze(comments) {
  var seen = {};
  var texts = [];
  for (var i = 0; i < comments.length && texts.length < MAX_TEXTS; i++) {
    var text = normalize(comments[i].content);
    if (text && !seen[text]) {
      seen[text] = true;
      texts.push(text);
    }
  }
  if (!texts.length) return;
  var mine = ++running;
  try {
    var hits = await detect(texts);
    if (mine !== running) return;
    var patterns = {};
    hits.forEach(function (hit) {
      var text = normalize(hit);
      if (text) patterns[text] = true;
    });
    pluginBlockWords = Object.keys(patterns).map(function (text) {
      return '剧透/^\\s*' + escapePattern(text) + '\\s*$/';
    });
    if (settings.getSwitch('debug')) dev.log('[防剧透] 命中 ' + pluginBlockWords.length + ' 条：' + Object.keys(patterns).slice(0, 200).join('||'));
    if (pluginBlockWords.length) ui.showSnackBar('已屏蔽 ' + pluginBlockWords.length + ' 种疑似剧透的弹幕');
  } catch (error) {
    if (mine === running) ui.showSnackBar('防剧透没有完成：' + (error && error.message ? error.message : error));
  }
}

function pluginOnEvent(event) {
  if (event.name === 'videoLoaded') {
    running++;
    pluginBlockWords = [];
    return;
  }
  if (event.name !== 'danmakuLoaded' || !settings.getSwitch('enabled')) return;
  var comments = (event.data && event.data.danmaku) || [];
  // The comments show at once; what the AI names is hidden when it answers.
  analyze(comments);
}

function pluginHandleUIAction(id) {
  if (id === 'enabled') {
    pluginUIEntries[0].enabled = settings.getSwitch('enabled');
    if (!pluginUIEntries[0].enabled) pluginBlockWords = [];
    return null;
  }
  if (id === 'debug') {
    pluginUIEntries[6].enabled = settings.getSwitch('debug');
    return null;
  }
  if (id !== 'test') return null;
  var sample = ['这集作画好棒', '男主下一集会死', '前方高能'];
  return detect(sample).then(
    function (hits) {
      return { type: 'text', title: '接口可以用', content: '示例弹幕：\n' + sample.join('\n') + '\n\nAI 认为剧透的：\n' + (hits.length ? hits.join('\n') : '（没有）') };
    },
    function (error) {
      return { type: 'text', title: '接口不能用', content: String(error && error.message ? error.message : error) };
    }
  );
}

function pluginOnInitialize() {
  pluginUIEntries[0].enabled = settings.getSwitch('enabled');
  pluginUIEntries[6].enabled = settings.getSwitch('debug');
}
