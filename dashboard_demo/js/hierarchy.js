/**
 * DAS Dashboard — 지역 계층 유틸: 글로벌 > 지역(Region) > 법인(Corporation) > 국가(Country)
 * 제품군 계층은 app.js에서 별도 처리 (제품군 > 레벨2 > 레벨3)
 */
(function(global) {
  var REGION_LEVELS = ['region', 'corporation', 'country'];
  var REGION_LEVEL_INDEX = { region: 0, corporation: 1, country: 2 };

  function getLevelIndex(levelName) {
    return REGION_LEVEL_INDEX[levelName] != null ? REGION_LEVEL_INDEX[levelName] : -1;
  }

  function getLevelName(index) {
    return REGION_LEVELS[index] || null;
  }

  function getDimensionKey(levelName, row) {
    switch (levelName) {
      case 'region': return row.region || null;
      case 'corporation': return row.entity || row.corporation || null;
      case 'country': return row.country || null;
      default: return null;
    }
  }

  function filterDataByRegionPath(data, path) {
    if (!data || !data.length) return [];
    if (!path || !path.length) return data.slice();
    var out = [];
    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      var match = true;
      for (var p = 0; p < path.length; p++) {
        var step = path[p];
        var key = getDimensionKey(getLevelName(step.level), row);
        if (key !== step.key) { match = false; break; }
      }
      if (match) out.push(row);
    }
    return out;
  }

  function getNextRegionLevelKeys(data, path) {
    var nextLevel = path ? path.length : 0;
    if (nextLevel >= REGION_LEVELS.length) return [];
    var filtered = filterDataByRegionPath(data, path);
    var name = REGION_LEVELS[nextLevel];
    var set = {};
    for (var i = 0; i < filtered.length; i++) {
      var k = getDimensionKey(name, filtered[i]);
      if (k) set[k] = true;
    }
    return Object.keys(set).sort();
  }

  global.DAS_HIERARCHY = {
    REGION_LEVELS: REGION_LEVELS,
    getLevelIndex: getLevelIndex,
    getLevelName: getLevelName,
    getDimensionKey: getDimensionKey,
    filterDataByPath: filterDataByRegionPath,
    filterDataByRegionPath: filterDataByRegionPath,
    getNextLevelKeys: function(data, path) { return getNextRegionLevelKeys(data, path); },
    getNextRegionLevelKeys: getNextRegionLevelKeys,
    getBreadcrumbLabels: function(path, labelMaps) {
      var labels = ['전체'];
      if (!path || !path.length) return labels;
      var maps = labelMaps || {};
      for (var i = 0; i < path.length; i++) {
        var step = path[i];
        var levelName = getLevelName(step.level);
        var map = maps[levelName];
        var label = (map && map[step.key]) ? map[step.key] : step.key;
        labels.push(label);
      }
      return labels;
    }
  };
})(typeof window !== 'undefined' ? window : this);
