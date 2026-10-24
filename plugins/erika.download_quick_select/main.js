// 下载快速选择，从 NipaPlay 移植：添加下载时「快速选择」列出以前下载过的
// 文件夹（Erika 自己记得），这里再加上媒体库里名字和种子对得上的番剧所在的
// 文件夹，方便直接下到对应番剧的文件夹。

var MOST_SHOWS = 3;

function pluginOnInitialize() {
  extend.downloadQuickSelect(true);
}

// Letters and digits only, lower case: titles and torrent names compare by
// what they spell, not by brackets and spaces.
function letters(text) {
  return Array.from(String(text || '').toLowerCase()).filter(function (c) {
    return /[0-9a-z\u00c0-\u024f\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af\uf900-\ufaff]/.test(c);
  });
}

// How much of `title` the torrent name spells, from 0 to 1, by pairs of
// letters.
function match(title, name) {
  var t = letters(title);
  var n = letters(name).join('');
  if (t.length === 0) return 0;
  if (n.indexOf(t.join('')) >= 0) return 1;
  if (t.length < 3) return 0;
  var found = 0;
  for (var i = 0; i + 1 < t.length; i++) {
    if (n.indexOf(t[i] + t[i + 1]) >= 0) found++;
  }
  return found / (t.length - 1);
}

function base(folder) {
  var parts = String(folder).split(/[\\/]/).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : folder;
}

function pluginDownloadSuggestions(torrent) {
  var name = (torrent && torrent.name) || '';
  var scored = library
    .getShows()
    .map(function (show) {
      return { show: show, score: match(show.title, name) };
    })
    .filter(function (entry) {
      return entry.score >= 0.7 && entry.show.folders && entry.show.folders.length;
    })
    .sort(function (a, b) {
      return b.score - a.score;
    })
    .slice(0, MOST_SHOWS);
  var suggestions = [];
  scored.forEach(function (entry) {
    entry.show.folders.forEach(function (folder) {
      suggestions.push({
        title: entry.show.folders.length > 1 ? entry.show.title + ' · ' + base(folder) : entry.show.title,
        folder: folder,
      });
    });
  });
  return suggestions;
}
