define([], function() {
  return {
    map: {
      basemap: 'gray'
    },

    view: {
      center: [139.77, 35.705],
      zoom: 12
    },

    layers: {
      // 【1番下のレイヤー：遅延のライン】
      delayLineLayerUrl: '',
      // 【2番目のレイヤー：路線図】
      basicLineUrl: '',
      // 【3番目のレイヤー：駅】
      stationPointUrl: '',
      // 【4番目のレイヤー：駅名】
      stationLabelUrl: ''
    },

    widgets: {
      // 気象オンラインサービス
      weatherInfo: {
        url: ''
      },
      // 検索用 API のエンドポイント
      twitterInfo: {
        url: 'http://localhost:3000/api/query'
      }
    }
  };
});
