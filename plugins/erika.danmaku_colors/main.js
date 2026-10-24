// 更多弹幕颜色：NipaPlay 发送弹幕的十五种预设里，Erika 默认没有的九种。
var COLORS = [
  { name: '橙', color: '#FF7106' },
  { name: '橙黄', color: '#FFAA01' },
  { name: '金黄', color: '#FFD301' },
  { name: '黄绿', color: '#A0EE02' },
  { name: '青', color: '#019899' },
  { name: '天蓝', color: '#89D5FF' },
  { name: '玫红', color: '#CC0173' },
  { name: '深灰', color: '#222222' },
  { name: '灰', color: '#9B9B9B' },
];

function pluginOnInitialize() {
  extend.danmakuColors(COLORS);
}
