define([
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/query',
  'esri/request',
  'esri/Map',
  'esri/views/MapView',
  'esri/layers/FeatureLayer',
  'esri/layers/MapImageLayer',
  'esri/geometry/Extent',
  'esri/tasks/support/Query',
  'esri/PopupTemplate',
  'esri/widgets/Legend',
  'esri/widgets/Home',
  'esri/widgets/BasemapGallery',
  'widgets/WeatherInfo',
  'widgets/TwitterInfo'
], function(declare, lang, dojoQuery, esriRequest, Map, MapView, FeatureLayer, MapImageLayer, Extent, Query, PopupTemplate, Legend, Home, BasemapGallery, WeatherInfo, TwitterInfo) {
  return declare(null, {
    delayLayer: null,
    delayLayerView: null,
    stationPoint: null,
    stationLayerView: null,

    startup: function() {
      var config = arguments[0];

      if (config) {
        this.config = config;
      } else {
        console.log('error: 設定ファイルがありません');
      }

      var layers = this._initLayers();
      this._initMap(layers);
    },

    _initLayers: function() {
      // 駅のシンボル
      var stationSymbol = {
        type: 'picture-marker',
        url: './img/station.png',
        width: '12px',
        height: '12px'
      };
      var stationRenderer = {
        type: 'simple',
        symbol: stationSymbol
      };

      // 通常路線のシンボル
      var ginza = {
        type: 'simple-line',
        color: '#FF9500',
        width: 2
      };
      var marunouchi = {
        type: 'simple-line',
        color: '#F62E36',
        width: 2
      };
      var hibiya = {
        type: 'simple-line',
        color: '#B5B5AC',
        width: 2
      };
      var tozai = {
        type: 'simple-line',
        color: '#009BBF',
        width: 2
      };
      var tiyoda = {
        type: 'simple-line',
        color: '#00BB85',
        width: 2
      };
      var yurakucho = {
        type: 'simple-line',
        color: '#C1A470',
        width: 2
      };
      var hanzoumon = {
        type: 'simple-line',
        color: '#8F76D6',
        width: 2
      };
      var nanboku = {
        type: 'simple-line',
        color: '#00AC9B',
        width: 2
      };
      var fukutoshin = {
        type: 'simple-line',
        color: '#9C5E31',
        width: 2
      };

      // 通常路線のレンダラー
      var basicLineRenderer = {
        type: 'unique-value',
        field: 'railway_title',
        uniqueValueInfos:[{
          value: '銀座',
          symbol: ginza,
          label: '銀座線'
        }, {
          value: '丸ノ内',
          symbol: marunouchi,
          label: '丸の内線'
        }, {
          value: '日比谷',
          symbol: hibiya,
          label: '日比谷線'
        }, {
          value: '東西',
          symbol: tozai,
          label: '東西線'
        }, {
          value: '千代田',
          symbol: tiyoda,
          label: '千代田線'
        }, {
          value: '有楽町',
          symbol: yurakucho,
          label: '有楽町線'
        }, {
          value: '半蔵門',
          symbol: hanzoumon,
          label: '半蔵門線'
        }, {
          value: '南北',
          symbol: nanboku,
          label: '南北線'
        }, {
          value: '副都心',
          symbol: fukutoshin,
          label: '副都心線'
        }]
      };

      // 【1番下のレイヤー：遅延のライン】
      this.delayLayer = this._createDelayFeatureLayer();

      // 【2番目のレイヤー：路線図】
      this.basicLine = new FeatureLayer({
        url: this.config.layers.basicLineUrl,
        renderer: basicLineRenderer,
        copyright: '国土交通省国土政策局「国土数値情報（鉄道データ）」をもとにESRIジャパンが編集・加工'
      });

      // 【3番目のレイヤー：駅】
      this.stationPoint = new FeatureLayer({
        url: this.config.layers.stationPointUrl,
        renderer: stationRenderer,
        outFields: ['station_title'],
        copyright: '国土交通省国土政策局「国土数値情報（鉄道データ）」をもとにESRIジャパンが編集・加工'
      });

      // 【4番目のレイヤー：駅名】
      var stationLabel = new MapImageLayer({
        url: this.config.layers.stationLabelUrl,
        copyright: '国土交通省国土政策局「国土数値情報（鉄道データ）」をもとにESRIジャパンが編集・加工'
      });

      return [this.delayLayer, this.basicLine, this.stationPoint, stationLabel];
    },

    _createDelayFeatureLayer: function() {
      var fields = [{
        name: 'ObjectID',
        alias: 'ObjectID',
        type: 'oid'
      }, {
        name: 'updtime',
        alias: 'updtime',
        type: 'date'
      }, {
        name: 'delay',
        alias: 'delay',
        type: 'integer'
      }];

      var renderer = {
        type: 'class-breaks',
        field: 'delay',
        classBreakInfos: [{
          minValue: 0,
          maxValue: 600,
          symbol: {
            type: 'simple-line',
            color: 'yellow',
            cap: 'round',
            width: 13
          },
          label: '10分以下'
        }, {
          minValue: 601,
          maxValue: 1200,
          symbol: {
            type: 'simple-line',
            color: 'orange',
            cap: 'round',
            width: 13
          },
          label: '11分～20分'
        }, {
          minValue: 1201,
          maxValue: 1800,
          symbol: {
            type: 'simple-line',
            color: 'deeppink',
            cap: 'round',
            width: 13
          },
          label: '21分～30分'
        }, {
          minValue: 1801,
          maxValue: Infinity,
          symbol: {
            type: 'simple-line',
            cap: 'round',
            color: '#ff0000',
            width: 13
          },
          label: '31分以上'
        }]
      };

      var layer = new FeatureLayer({
        fields: fields,
        objectIdField: 'ObjectID',
        geometryType: 'polyline',
        spatialReference: {
          wkid: 102100
        },
        source: [],
        renderer: renderer,
        opacity: 0.7,
        id: 'delayFeatureFayer',
        copyright: '東京公共交通オープンデータチャレンジ'
      });

      return layer;
    },

    _initMap: function(layers) {
      var map = new Map({
        basemap: this.config.map.basemap,
        layers: layers
      });

      this.view = new MapView({
        container: 'viewDiv',
        map: map,
        center: this.config.view.center,
        zoom: this.config.view.zoom,
        constraints: {
          rotationEnabled: false
        },
        padding: {
          top: 50,
          bottom: 0
        }
      });

      this.view.whenLayerView(this.delayLayer).then(lang.hitch(this, function(lyrView) {
        lyrView.watch('updating', lang.hitch(this, function(val) {
          if (!val) {
            this.delayLayerView = lyrView;
          }
        }));
      }));

      this.view.whenLayerView(this.stationPoint).then(lang.hitch(this, function(lyrView) {
        lyrView.watch('updating', lang.hitch(this, function(val) {
          if (!val) {
            this.stationLayerView = lyrView;
          }
        }));
      }));

      this.view.when(lang.hitch(this, function() {
        this._getDelayFeatures();
        this._initPopup();
        this._initWidget();
      }));
    },

    _getDelayFeatures: function() {
      this._queryFeatureCount();
      setInterval(this._queryFeatureCount.bind(this), 30000);
    },

    _queryFeatureCount: function() {
      this.view.popup.close();

      var url = this.config.layers.delayLineLayerUrl + '/query';
      var options = {
        query: {
          f: 'json',
          returnIdsOnly: true,
          returnCountOnly: true,
          returnGeometry: false,
          spatialRel: 'esriSpatialRelIntersects',
          where: '1 = 1'
        },
        cacheBust: true,
        responseType: 'json'
      };

      esriRequest(url, options).then(lang.hitch(this, function(response) {
        if (response.data.count > 0) {
          this._queryFeature();
        } else {
          this.delayLayer.source.removeAll();
          dojoQuery('.calcite-title-delay').removeClass('calcite-title-delay--hide');
        }
      })).otherwise(function(err) {
        console.log(err);
      });
    },

    _queryFeature: function() {
      var url = this.config.layers.delayLineLayerUrl + '/query';
      var options = {
        query: {
          f: 'json',
          outFields: 'OBJECTID,Updtime,delay',
          spatialRel: 'esriSpatialRelIntersects',
          where: '1 = 1'
        },
        cacheBust: true,
        responseType: 'json'
      };

      esriRequest(url, options).then(lang.hitch(this, function(response) {
        if (response.data.features.length > 0) {
          var source = response.data.features.map(function(feature) {
            return {
              attributes: {
                ObjectID: feature.attributes.OBJECTID,
                updtime: feature.attributes.updtime,
                delay: feature.attributes.delay
              },
              geometry: {
                type: 'polyline',
                paths: feature.geometry.paths,
                spatialReference: {
                  wkid: 102100
                }
              }
            };
          });
          this.delayLayer.source.removeAll();
          this.delayLayer.source.addMany(source);
          dojoQuery('.calcite-title-delay').addClass('calcite-title-delay--hide');
        }
      })).otherwise(function(err) {
        console.log(err);
      });
    },

    _initPopup: function() {
      var self = this;

      self.view.on('click', function(evt) {
        evt.stopPropagation();

        var query = new Query();
        query.geometry = new Extent({
          xmin: evt.mapPoint.x - 300,
          ymin: evt.mapPoint.y - 300,
          xmax: evt.mapPoint.x + 300,
          ymax: evt.mapPoint.y + 300,
          spatialReference: {
            wkid: 102100
          }
        });
        query.spatialRelationship = 'intersects';

        var layerViews = [self.delayLayerView, self.stationLayerView];
        queryPopups(layerViews).then(function(results) {
          var features = [];
          results.forEach(function(items) {
            if (items.length > 0) {
              items.forEach(function(item) {
                features.push(item);
              });
            }
          });
          if (features.length > 0) {
            self.view.popup.open({
              location: evt.mapPoint,
              features: features
            });
          } else {
            self.view.popup.close();
          }
        });

        function queryPopups(layerViews) {
          return Promise.all(layerViews.map(function(layerView) {
            return new Promise(function(resolve, reject) {
              layerView.queryFeatures(query).then(function(results) {
                if (results.length > 0) {
                  var features = results.map(function(feature) {
                    if (feature.layer.id === 'delayFeatureFayer') {
                      return self._getDelayPopup(feature);
                    } else {
                      return self._getStationPopup(feature);
                    }
                  });
                  resolve(features);
                }
              });
              resolve([]);
            });
          }));
        }
      });
    },

    _getDelayPopup: function(graphic) {
      var g = graphic.clone();

      g.popupTemplate = new PopupTemplate({
        title: "<font size='5', color ='red'>遅延情報",
        expressionInfos: [{
          name: 'delay-minutes',
          expression: '($feature.delay)/60'
        }, {
          name: 'delay-updtime',
          expression: document.getElementById('timecalc-arcade').text
        }],
        content: [{
          type: 'text',
          text: "<span class='pop--delay-minutes1'>{expression/delay-minutes}分</span><span class='pop--delay-minutes2'>の遅れが発生しています。</span>"
        }, {
          type: 'text',
          text: "<span class='pop--delay-updtime'>{expression/delay-updtime} 現在</span>"
        }]
      });

      return g;
    },

    _getStationPopup: function(graphic) {
      var g = graphic.clone();

      g.popupTemplate = new PopupTemplate({
        title: "駅名",
        content: "<font size='4.5'>{station_title}駅"
      });

      return g;
    },

    _initWidget: function() {
      // 凡例
      var legendFlg = false;
      var legend = new Legend({
        view: this.view,
        layerInfos: [{
          layer: this.delayLayer,
          title: '遅延時間'
        }, {
          layer: this.basicLine,
          title: '路線名'
        }]
      });
      this.view.ui.add(legend, 'bottom-left');
      document.getElementById('legendBtn').addEventListener('click', function() {
        var x = document.getElementsByClassName('esri-component esri-legend esri-widget')[0];

        if (legendFlg) {
          x.style.display = 'none';
          legendFlg = false;
        } else {
          x.style.display = 'block';
          legendFlg = true;
        }
      });

      // ホーム
      var homeWidget = new Home({
        view: this.view
      });
      this.view.ui.add(homeWidget, 'top-left');

      // ベースマップギャラリー
      var bgFlg = false;
      var basemapGallery = new BasemapGallery({
        view: this.view
      });
      basemapGallery.watch('source.state', function(val) {
        if (val === 'ready') {
          dojoQuery('.esri-basemap-gallery').addClass('esri-basemap-gallery--hide');
        }
      });
      this.view.ui.add(basemapGallery, 'top-right');
      document.getElementById('basemapBtn').addEventListener('click', function() {
        if (bgFlg) {
          dojoQuery('.esri-basemap-gallery').addClass('esri-basemap-gallery--hide');
          bgFlg = false;
        } else {
          if (creditVizFlg) {
            dojoQuery('#panelInfo').removeClass('in');
            dojoQuery('#collapseInfo').removeClass('in');
            dojoQuery('.nav-button').removeClass('active');
            creditVizFlg = false;
          }
          if (twiVizFlg) {
            twitterInfo.isHide = true;
            twitterInfo.stopQuery();
            twiVizFlg = false;
          }
          dojoQuery('.esri-basemap-gallery').removeClass('esri-basemap-gallery--hide');
          bgFlg = true;
        }
      });

      // 気象データ
      var wiVizFlg = false;
      var weatherInfo = new WeatherInfo({
        view: this.view,
        url: this.config.widgets.weatherInfo.url
      });
      this.view.ui.add(weatherInfo, 'bottom-left');
      document.getElementById('weatherInfoBtn').addEventListener('click', function() {
        if (wiVizFlg) {
          weatherInfo.isHide = true;
          weatherInfo.invisible();
          wiVizFlg = false;
        } else {
          weatherInfo.isHide = false;
          weatherInfo.visible();
          wiVizFlg = true;
        }
      });

      // Twitter
      var twiVizFlg = false;
      var twitterInfo = new TwitterInfo({
        url: this.config.widgets.twitterInfo.url
      });
      this.view.ui.add(twitterInfo, 'top-right');
      document.getElementById('twitterInfoBtn').addEventListener('click', function() {
        if (twiVizFlg) {
          twitterInfo.isHide = true;
          twitterInfo.stopQuery();
          twiVizFlg = false;
        } else {
          if (bgFlg) {
            dojoQuery('.esri-basemap-gallery').addClass('esri-basemap-gallery--hide');
            bgFlg = false;
          }
          if (creditVizFlg) {
            dojoQuery('#panelInfo').removeClass('in');
            dojoQuery('#collapseInfo').removeClass('in');
            dojoQuery('.nav-button').removeClass('active');
            creditVizFlg = false;
          }
          twitterInfo.isHide = false;
          twitterInfo.startQuery();
          twiVizFlg = true;
        }
      });

      // クレジット表記
      var creditVizFlg = false;
      dojoQuery('.nav-button').on('click', function() {
        if (creditVizFlg) {
          dojoQuery('#panelInfo').removeClass('in');
          dojoQuery('#collapseInfo').removeClass('in');
          dojoQuery('.nav-button').removeClass('active');
          creditVizFlg = false;
        } else {
          if (bgFlg) {
            dojoQuery('.esri-basemap-gallery').addClass('esri-basemap-gallery--hide');
            bgFlg = false;
          }
          if (twiVizFlg) {
            twitterInfo.isHide = true;
            twitterInfo.stopQuery();
            twiVizFlg = false;
          }
          dojoQuery('#panelInfo').addClass('in');
          dojoQuery('#collapseInfo').addClass('in');
          dojoQuery('.nav-button').addClass('active');
          creditVizFlg = true;
        }
      });
    }

  });
});
