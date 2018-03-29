/// <amd-dependency path="esri/core/tsSupport/declareExtendsHelper" name="__extends" />
/// <amd-dependency path="esri/core/tsSupport/decorateHelper" name="__decorate" />
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define(["require", "exports", "esri/core/tsSupport/declareExtendsHelper", "esri/core/tsSupport/decorateHelper", "esri/core/accessorSupport/decorators", "esri/widgets/Widget", "esri/widgets/support/widget"], function (require, exports, __extends, __decorate, decorators_1, Widget, widget_1) {
    "use strict";
    var CSS = {
        base: "twitter-info",
        hide: "twitter-info--hide",
        box: "twitter-info--box",
        tweetbox: "twitter-info--tweetbox",
        dropdownbox: "twitter-info--dropdownbox",
        tweetframe: "twitter-info--tweetframe",
        tweetusername: "twitter-info--tweetusername",
        tweettext: "twitter-info--tweettext",
        tweetactions: "twitter-info--tweetactions"
    };
    var TwitterInfo = /** @class */ (function (_super) {
        __extends(TwitterInfo, _super);
        function TwitterInfo() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.isHide = true;
            _this.data = [];
            _this.type = 'all';
            return _this;
        }
        TwitterInfo.prototype.startQuery = function () {
            if (!this.timeoutId) {
                this._initQuery(false);
            }
        };
        TwitterInfo.prototype.stopQuery = function () {
            if (this.timeoutId) {
                clearTimeout(this.timeoutId);
                this.timeoutId = null;
                this.data = [];
            }
        };
        TwitterInfo.prototype.render = function () {
            var _this = this;
            var dynamicClasses = (_a = {},
                _a[CSS.hide] = this.isHide,
                _a);
            var tweets = this.data.map(function (item) {
                var createdAt = _this._getData(item.created_at);
                var username = item.user.name + '@' + item.user.screen_name;
                return (widget_1.tsx("div", { key: item.id.toString() },
                    widget_1.tsx("div", { class: CSS.tweetframe },
                        widget_1.tsx("img", { src: item.user.profile_image_url }),
                        widget_1.tsx("div", { class: CSS.tweetusername },
                            widget_1.tsx("div", null, username),
                            widget_1.tsx("div", null,
                                widget_1.tsx("img", { src: "./img/icon.svg" }))),
                        widget_1.tsx("div", { class: CSS.tweettext },
                            widget_1.tsx("p", null, item.text)),
                        widget_1.tsx("div", { class: CSS.tweetactions },
                            widget_1.tsx("span", null,
                                widget_1.tsx("img", { src: "./img/retweet.svg" }),
                                item.retweet_count),
                            widget_1.tsx("span", null,
                                widget_1.tsx("img", { src: "./img/favorite.svg" }),
                                item.favorite_count),
                            widget_1.tsx("span", null, createdAt))),
                    widget_1.tsx("hr", null)));
            });
            var optionData = [{
                    value: 'all',
                    label: '-- 路線を選択 --'
                }, {
                    value: 'G',
                    label: '銀座線'
                }, {
                    value: 'M',
                    label: '丸ノ内線'
                }, {
                    value: 'H',
                    label: '日比谷線'
                }, {
                    value: 'T',
                    label: '東西線'
                }, {
                    value: 'C',
                    label: '千代田線'
                }, {
                    value: 'Y',
                    label: '有楽町線'
                }, {
                    value: 'Z',
                    label: '半蔵門線'
                }, {
                    value: 'N',
                    label: '南北線'
                }, {
                    value: 'F',
                    label: '副都心線'
                }];
            var options = optionData.map(function (item) {
                return (widget_1.tsx("option", { key: item.value, value: item.value }, item.label));
            });
            return (widget_1.tsx("div", { class: CSS.base, classes: dynamicClasses },
                widget_1.tsx("div", { class: CSS.box },
                    widget_1.tsx("div", { class: CSS.tweetbox }, tweets),
                    widget_1.tsx("div", { class: CSS.dropdownbox },
                        widget_1.tsx("select", { bind: this, value: this.type, onchange: this._handleChange }, options)))));
            var _a;
        };
        TwitterInfo.prototype._initQuery = function (change) {
            var _this = this;
            var target = this.type;
            var q = (target === 'all') ? '遅延'
                : (target === 'G') ? '遅延 銀座線'
                    : (target === 'M') ? '遅延 丸ノ内線'
                        : (target === 'H') ? '遅延 日比谷線'
                            : (target === 'T') ? '遅延 東西線'
                                : (target === 'C') ? '遅延 千代田線'
                                    : (target === 'Y') ? '遅延 有楽町線'
                                        : (target === 'Z') ? '遅延 半蔵門線'
                                            : (target === 'N') ? '遅延 南北線'
                                                : '遅延 副都心線';
            var endpoint = this.url + '?q=' + q;
            fetch(endpoint).then(function (res) {
                if (res.ok) {
                    return res.json();
                }
                else {
                    throw new Error();
                }
            }).then(function (json) {
                var dataset;
                if (change) {
                    dataset = json.statuses;
                }
                else {
                    var filtered = json.statuses.filter(function (item) {
                        var status = _this.data.some(function (d) {
                            return (d.id === item.id);
                        });
                        return (!status);
                    });
                    dataset = filtered.concat(_this.data);
                }
                _this.data = dataset;
            }).catch(function (err) {
                throw new Error();
            });
            this.timeoutId = setTimeout(this._initQuery.bind(this, false), 10000);
        };
        TwitterInfo.prototype._getData = function (utcDate) {
            var date = new Date(utcDate);
            var y = date.getFullYear();
            var m = date.getMonth() + 1;
            var d = date.getDate();
            var h = date.getHours();
            var mi = date.getMinutes();
            var s = date.getSeconds();
            if (mi < 10) {
                mi = '0' + d;
            }
            if (s < 10) {
                s = '0' + s;
            }
            return y + '/' + m + '/' + d + ' ' + h + ':' + mi + ':' + s;
        };
        TwitterInfo.prototype._handleChange = function (evt) {
            this.type = evt.target.value;
            clearTimeout(this.timeoutId);
            this._initQuery(true);
        };
        __decorate([
            decorators_1.property(),
            widget_1.renderable()
        ], TwitterInfo.prototype, "url", void 0);
        __decorate([
            decorators_1.property(),
            widget_1.renderable()
        ], TwitterInfo.prototype, "isHide", void 0);
        __decorate([
            decorators_1.property(),
            widget_1.renderable()
        ], TwitterInfo.prototype, "data", void 0);
        __decorate([
            decorators_1.property(),
            widget_1.renderable()
        ], TwitterInfo.prototype, "type", void 0);
        TwitterInfo = __decorate([
            decorators_1.subclass("esri.widgets.TwitterInfo")
        ], TwitterInfo);
        return TwitterInfo;
    }(decorators_1.declared(Widget)));
    return TwitterInfo;
});
