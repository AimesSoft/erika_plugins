// 自动弹幕偏移：弹幕按电视播出的时间轴发送，而网飞和一些 Aniplex 的片源在
// 正片前多了几秒片头，弹幕就早了。这个插件让 liberika 量一下视频开头的
// 几秒，认出片头后按经验长度把弹幕延后。

var pluginUIEntries = [
  { id: 'netflix', title: '网飞片头', description: '黑底上的红色 N。', enabled: true },
  { id: 'netflix_seconds', title: '网飞片头长度（秒）', textSetting: { hintText: '5', default: '5' } },
  { id: 'aniplex', title: 'Aniplex 片头', description: '白底上的 Aniplex 标志。', enabled: true },
  { id: 'aniplex_seconds', title: 'Aniplex 片头长度（秒）', textSetting: { hintText: '5', default: '5' } },
  { id: 'notify', title: '偏移时提示', enabled: true },
];

function switchOn(id, fallback) {
  return settings.getSwitch(id, fallback);
}

function seconds(id) {
  var value = parseFloat(settings.getText(id, '5'));
  return isNaN(value) ? 5 : Math.max(0, Math.min(10, value));
}

// The frames of the first `limit` seconds.
function first(frames, limit) {
  return frames.filter(function (frame) {
    return frame.time < limit;
  });
}

// The red N on black: dark frames with a red letter in them, at least two.
function netflix(frames) {
  var hits = first(frames, 6).filter(function (frame) {
    return frame.dark >= 0.55 && frame.red_share >= 0.015 && frame.red > frame.green * 1.6;
  });
  return hits.length >= 2;
}

// The logo on white: several frames in a row that are mostly white.
function aniplex(frames) {
  var run = 0;
  var best = 0;
  first(frames, 7).forEach(function (frame) {
    run = frame.white >= 0.6 && frame.luma >= 0.8 ? run + 1 : 0;
    best = Math.max(best, run);
  });
  return best >= 4;
}

function pluginOnInitialize() {
  extend.openingProfile(true);
  pluginUIEntries[0].enabled = switchOn('netflix', true);
  pluginUIEntries[2].enabled = switchOn('aniplex', true);
  pluginUIEntries[4].enabled = switchOn('notify', true);
}

function pluginHandleUIAction(id) {
  pluginOnInitialize();
  return null;
}

function pluginOnEvent(event) {
  if (event.name !== 'openingProfiled') return;
  var frames = (event.data && event.data.frames) || [];
  var found = null;
  if (switchOn('netflix', true) && netflix(frames)) found = { name: '网飞', seconds: seconds('netflix_seconds') };
  else if (switchOn('aniplex', true) && aniplex(frames)) found = { name: 'Aniplex', seconds: seconds('aniplex_seconds') };
  if (!found || found.seconds === 0) return;
  danmaku.setOffset(found.seconds);
  if (switchOn('notify', true)) ui.showSnackBar('检测到' + found.name + '片头，弹幕延后 ' + found.seconds + ' 秒');
}
