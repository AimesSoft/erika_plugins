// 自动弹幕偏移：弹幕按电视播出的时间轴发送，而网飞的片源在正片前多了几秒
// 片头，弹幕就早了。这个插件让 liberika 量一下视频开头的几秒，认出网飞
// 片头后按经验长度把弹幕延后。

var pluginUIEntries = [
  { id: 'seconds', title: '网飞片头长度（秒）', description: '认出片头后弹幕延后这么多。', textSetting: { hintText: '5', default: '5' } },
  { id: 'notify', title: '偏移时提示', enabled: true },
];

function seconds() {
  var value = parseFloat(settings.getText('seconds', '5'));
  return isNaN(value) ? 5 : Math.max(0, Math.min(10, value));
}

// A frame of the ident: nearly all black, with a small red letter in it
// and no other color.
function redOnBlack(frame) {
  return frame.dark >= 0.9 &&
    frame.red_share >= 0.01 && frame.red_share <= 0.2 &&
    frame.red > frame.green * 4 && frame.red > frame.blue * 4;
}

// The red N on black: it shows within the first three seconds and stays at
// least a second and a half. Measured on a Netflix WEB-DL: black until 1.1 s,
// the letter from 1.4 s to 3.4 s, its ribbons until 5 s, black again at 5.1 s.
function netflix(frames) {
  var run = 0;
  var start = null;
  for (var i = 0; i < frames.length && frames[i].time < 6; i++) {
    var frame = frames[i];
    if (redOnBlack(frame)) {
      if (run === 0) start = frame.time;
      run += 1;
      if (start <= 3 && frame.time - start >= 1.5) return true;
    } else {
      run = 0;
    }
  }
  return false;
}

function pluginOnInitialize() {
  extend.openingProfile(true);
  pluginUIEntries[1].enabled = settings.getSwitch('notify', true);
}

function pluginHandleUIAction(id) {
  pluginOnInitialize();
  return null;
}

// The offset this plugin set and the one it replaced: a video without the
// ident gets the earlier offset back, unless the user changed it since.
function undo() {
  var last = storage.get('applied');
  if (!last) return;
  if (danmaku.getOffset() === last.offset) danmaku.setOffset(last.before);
  storage.remove('applied');
}

function pluginOnDestroy() {
  undo();
}

function pluginOnEvent(event) {
  if (event.name !== 'openingProfiled') return;
  var frames = (event.data && event.data.frames) || [];
  var delay = seconds();
  if (delay === 0 || !netflix(frames)) {
    undo();
    return;
  }
  var last = storage.get('applied');
  var current = danmaku.getOffset();
  var before = last && current === last.offset ? last.before : current;
  danmaku.setOffset(delay);
  storage.set('applied', { offset: delay, before: before });
  if (settings.getSwitch('notify', true)) ui.showSnackBar('检测到网飞片头，弹幕延后 ' + delay + ' 秒');
}
