// 底部进度条：画面最下面一条 2 点高的细线，长度就是播放进度。移植自 NipaPlay
// 的「底部进度条」。开关和颜色在播放器的弹幕菜单里。
var SHOW = { id: 'show', title: '底部进度条', enabled: true, placement: 'danmakuMenu' };
var COLOR = { id: 'color', title: '进度条颜色', colorSetting: { default: 'red' }, placement: 'danmakuMenu' };

var pluginUIEntries = [SHOW, COLOR];

function apply() {
  var shown = settings.getSwitch('show', true);
  SHOW.enabled = shown;
  // 关掉时只留开关。
  pluginUIEntries = shown ? [SHOW, COLOR] : [SHOW];
  // 旧版 Erika 没有这个接口。
  if (!extend.progressStrip) return;
  extend.progressStrip(shown ? settings.getText('color', 'red') : null);
}

function pluginOnInitialize() {
  apply();
}

function pluginHandleUIAction(id) {
  apply();
  return null;
}
