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
define(["require", "exports", "esri/core/tsSupport/declareExtendsHelper", "esri/core/tsSupport/decorateHelper", "esri/core/accessorSupport/decorators", "esri/widgets/Widget", "esri/widgets/support/widget", "esri/layers/ImageryLayer"], function (require, exports, __extends, __decorate, decorators_1, Widget, widget_1, ImageryLayer) {
    "use strict";
    var CSS = {
        base: "weatherinfo-info",
        hide: "weatherinfo-info--hide",
        container: "weatherinfo-info--container",
        item: "weatherinfo-info--item",
        label: "weatherinfo-info--label",
        button: "weatherinfo-info--button",
        play: "esri-icon-play",
        pause: "esri-icon-pause"
    };
    var WeatherInfo = /** @class */ (function (_super) {
        __extends(WeatherInfo, _super);
        function WeatherInfo() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.isHide = true;
            _this.visible = function () {
                if (!_this.layer.visible) {
                    _this.layer.visible = true;
                }
            };
            _this.invisible = function () {
                if (_this.layer.visible) {
                    _this.layer.visible = false;
                }
            };
            _this.currIntervalStr = "0";
            _this.currInterval = 0;
            _this.intervalTexts = ["0000 分後", "0005 分後", "0010 分後", "0015 分後", "0020 分後", "0025 分後", "0030 分後", "0035 分後", "0040 分後", "0045 分後", "0050 分後", "0055 分後", "0060 分後"];
            _this.sliderLabel = "現在";
            _this.labelTexts = ["現在", "5分後", "10分後", "15分後", "20分後", "25分後", "30分後", "35分後", "40分後", "45分後", "50分後", "55分後", "1時間後"];
            _this.playFlg = false;
            _this.isPlay = true;
            _this.isPause = false;
            return _this;
        }
        WeatherInfo.prototype.postInitialize = function () {
            this.layer = this._initLayer();
        };
        WeatherInfo.prototype.render = function () {
            var dynamicHideClasses = (_a = {},
                _a[CSS.hide] = this.isHide,
                _a);
            var dynamicButtonClasses = (_b = {},
                _b[CSS.play] = this.isPlay,
                _b[CSS.pause] = this.isPause,
                _b);
            return (widget_1.tsx("div", { class: CSS.base, classes: dynamicHideClasses },
                widget_1.tsx("div", { class: CSS.container },
                    widget_1.tsx("div", { class: CSS.item },
                        widget_1.tsx("input", { bind: this, type: "range", min: "0", max: "12", step: "1", list: "weatherinfo_tickmarks", value: this.currIntervalStr, onchange: this._sliderHandleChange }),
                        widget_1.tsx("datalist", { id: "weatherinfo_tickmarks" },
                            widget_1.tsx("option", { value: "0", label: "\u73FE\u5728" }),
                            widget_1.tsx("option", { value: "1" }),
                            widget_1.tsx("option", { value: "2" }),
                            widget_1.tsx("option", { value: "3" }),
                            widget_1.tsx("option", { value: "4" }),
                            widget_1.tsx("option", { value: "5" }),
                            widget_1.tsx("option", { value: "6", label: "30\u5206\u5F8C" }),
                            widget_1.tsx("option", { value: "7" }),
                            widget_1.tsx("option", { value: "8" }),
                            widget_1.tsx("option", { value: "9" }),
                            widget_1.tsx("option", { value: "10" }),
                            widget_1.tsx("option", { value: "11" }),
                            widget_1.tsx("option", { value: "12", label: "1\u6642\u9593\u5F8C" }))),
                    widget_1.tsx("div", { class: CSS.item },
                        widget_1.tsx("div", { class: CSS.label }, this.sliderLabel),
                        widget_1.tsx("div", { class: CSS.button, bind: this, onclick: this._HandleClick },
                            widget_1.tsx("span", { classes: dynamicButtonClasses, "aria-label": "play icon" }))))));
            var _a, _b;
        };
        WeatherInfo.prototype._initLayer = function () {
            var layer = new ImageryLayer({
                portalItem: {
                    id: this.itemId
                },
                definitionExpression: "interval_text = '0000 分後'",
                visible: false,
                opacity: 0.6
            });
            this.view.map.add(layer);
            return layer;
        };
        WeatherInfo.prototype._sliderHandleChange = function (evt) {
            this.currInterval = Number(evt.target.value);
            this.sliderLabel = this.labelTexts[this.currInterval];
            var defExp = "interval_text = '" + this.intervalTexts[this.currInterval] + "'";
            this.layer.definitionExpression = defExp;
        };
        WeatherInfo.prototype._HandleClick = function () {
            if (!this.playFlg) {
                this.playTimeSlider();
                this.isPlay = false;
                this.isPause = true;
                this.playFlg = true;
            }
            else {
                clearTimeout(this.intervalTimeout);
                this.isPlay = true;
                this.isPause = false;
                this.playFlg = false;
            }
        };
        WeatherInfo.prototype.playTimeSlider = function () {
            this.currIntervalStr = this.currInterval.toString();
            this.sliderLabel = this.labelTexts[this.currInterval];
            var defExp = "interval_text = '" + this.intervalTexts[this.currInterval] + "'";
            this.layer.definitionExpression = defExp;
            if (this.currInterval < 12) {
                this.currInterval++;
            }
            else {
                this.currInterval = 0;
            }
            this.intervalTimeout = setTimeout(this.playTimeSlider.bind(this), 3000);
        };
        __decorate([
            decorators_1.property(),
            widget_1.renderable()
        ], WeatherInfo.prototype, "view", void 0);
        __decorate([
            decorators_1.property(),
            widget_1.renderable()
        ], WeatherInfo.prototype, "isHide", void 0);
        __decorate([
            decorators_1.property(),
            widget_1.renderable()
        ], WeatherInfo.prototype, "itemId", void 0);
        __decorate([
            decorators_1.property(),
            widget_1.renderable()
        ], WeatherInfo.prototype, "currIntervalStr", void 0);
        __decorate([
            decorators_1.property(),
            widget_1.renderable()
        ], WeatherInfo.prototype, "sliderLabel", void 0);
        WeatherInfo = __decorate([
            decorators_1.subclass("esri.widgets.WeatherInfo")
        ], WeatherInfo);
        return WeatherInfo;
    }(decorators_1.declared(Widget)));
    return WeatherInfo;
});
