// 倍速扩展：倍速菜单里多出 0.25× 到 5× 之间的倍速。liberika 支持 0.25× 到 16×。
var COMMON = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5];

var pluginUIEntries = [
  {
    id: 'fine',
    title: '更细的档位',
    description: '在 0.25× 到 5× 之间每 0.25× 一档；关掉时只加常用的几档。',
    enabled: false,
  },
];

function rates() {
  if (!settings.getSwitch('fine')) return COMMON;
  var list = [];
  for (var step = 1; step <= 20; step++) list.push(step / 4);
  return list;
}

function apply() {
  pluginUIEntries[0].enabled = settings.getSwitch('fine');
  extend.speeds(rates());
}

function pluginOnInitialize() {
  apply();
}

function pluginHandleUIAction(id) {
  if (id === 'fine') apply();
  return null;
}
