// 自动弹幕偏移：弹幕按电视播出的时间轴发送，而网飞的片源在正片前多了片头和
// 一段黑场，弹幕就早了。这个插件让 liberika 量一下视频开头，认出网飞片头
// 后找到黑场结束、正片开始的时刻，把弹幕延后这么多。

var pluginUIEntries = [
  { id: 'notify', title: '偏移时提示', enabled: true },
];

// How much of each video to measure: what Netflix puts before the episode
// ends well within this. Measured on a Netflix WEB-DL: black until 1.3 s,
// the letter and its ribbons until 4.96 s, black, a dim 「A Netflix Series」
// from 6.1 s to 9.9 s, black again, and the episode fading in at 11.6 s.
var LOOK = 30;

// A frame of the ident: nearly all black, with a small red letter in it
// and no other color.
function redOnBlack(frame) {
  return frame.dark >= 0.9 &&
    frame.red_share >= 0.01 && frame.red_share <= 0.2 &&
    frame.red > frame.green * 4 && frame.red > frame.blue * 4;
}

// A frame with nothing on it.
function black(frame) {
  return frame.dark >= 0.98 && frame.luma < 0.008 && frame.red_share < 0.005;
}

// A frame mostly lit: not black, and not a line of dim words on black.
function picture(frame) {
  return frame.dark < 0.9;
}

// Where the red N on black starts: within the first three seconds, staying
// at least a second and a half; -1 without it.
function ident(frames) {
  var run = 0;
  var start = -1;
  for (var i = 0; i < frames.length && frames[i].time < 6; i++) {
    var frame = frames[i];
    if (redOnBlack(frame)) {
      if (run === 0) start = i;
      run += 1;
      if (frames[start].time <= 3 && frame.time - frames[start].time >= 1.5) return start;
    } else {
      run = 0;
    }
  }
  return -1;
}

// When the episode starts after the ident at `from`: past the black that
// ends the ident, the first picture, or where it fades in, right after the
// last black before it. Without a picture within what was measured, when
// that black started; without the black, null.
function episodeStart(frames, from) {
  var gap = from;
  while (gap < frames.length && !black(frames[gap])) gap++;
  if (gap === frames.length) return null;
  for (var i = gap; i < frames.length; i++) {
    if (!picture(frames[i])) continue;
    var last = i;
    while (!black(frames[last - 1])) last--;
    return frames[last].time;
  }
  return frames[gap].time;
}

function pluginOnInitialize() {
  extend.openingProfile(true, LOOK);
  pluginUIEntries[0].enabled = settings.getSwitch('notify', true);
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
  var start = ident(frames);
  var at = start < 0 ? null : episodeStart(frames, start);
  if (at === null) {
    undo();
    return;
  }
  var delay = Math.round(at * 10) / 10;
  var last = storage.get('applied');
  var current = danmaku.getOffset();
  var before = last && current === last.offset ? last.before : current;
  danmaku.setOffset(delay);
  storage.set('applied', { offset: delay, before: before });
  if (settings.getSwitch('notify', true)) ui.showSnackBar('检测到网飞片头，弹幕延后 ' + delay + ' 秒');
}
