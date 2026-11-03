// 弹幕密度图：画面最下面一条 20 点高的曲线，画出整集弹幕的疏密。移植自
// NipaPlay 的「弹幕密度曲线」：整集分成最多 150 段（每段至少 1 秒），数每段的
// 弹幕，再与前后两段取平均。数的是正在显示的弹幕，别的插件去掉的和屏蔽词挡住
// 的不算。开关和颜色在播放器的弹幕菜单里。
var SHOW = { id: 'show', title: '弹幕密度图', enabled: true, placement: 'danmakuMenu' };
var COLOR = { id: 'color', title: '密度图颜色', colorSetting: { default: 'red' }, placement: 'danmakuMenu' };

var pluginUIEntries = [SHOW, COLOR];

function apply() {
  var shown = settings.getSwitch('show', true);
  SHOW.enabled = shown;
  // 关掉时只留开关。
  pluginUIEntries = shown ? [SHOW, COLOR] : [SHOW];
  // 旧版 Erika 没有这个接口。
  if (!extend.danmakuDensity) return;
  extend.danmakuDensity(shown ? settings.getText('color', 'red') : null);
}

function pluginOnInitialize() {
  apply();
}

function pluginHandleUIAction(id) {
  apply();
  return null;
}
