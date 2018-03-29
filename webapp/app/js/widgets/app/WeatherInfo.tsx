/// <amd-dependency path="esri/core/tsSupport/declareExtendsHelper" name="__extends" />
/// <amd-dependency path="esri/core/tsSupport/decorateHelper" name="__decorate" />

import { subclass, declared, property } from "esri/core/accessorSupport/decorators";
import Widget = require("esri/widgets/Widget");

import { renderable, tsx } from "esri/widgets/support/widget";

import MapView = require("esri/views/MapView");
import ImageryLayer = require("esri/layers/ImageryLayer");

const CSS = {
  base: "weatherinfo-info",
  hide: "weatherinfo-info--hide",
  container: "weatherinfo-info--container",
  item: "weatherinfo-info--item",
  label: "weatherinfo-info--label",
  button: "weatherinfo-info--button",
  play: "esri-icon-play",
  pause: "esri-icon-pause"
};

@subclass("esri.widgets.WeatherInfo")
class WeatherInfo extends declared(Widget) {

  @property()
  @renderable()
  view: MapView;

  @property()
  @renderable()
  isHide: boolean = true;

  @property()
  @renderable()
  itemId: string;

  visible:any = () => {
    if (!this.layer.visible) {
      this.layer.visible = true;
    }
  };

  invisible:any = () => {
    if (this.layer.visible) {
      this.layer.visible = false;
    }
  };

  private layer: ImageryLayer;

  @property()
  @renderable()
  private currIntervalStr: string = "0";

  private currInterval: number = 0;

  private intervalTexts = ["0000 分後", "0005 分後", "0010 分後", "0015 分後", "0020 分後", "0025 分後", "0030 分後", "0035 分後", "0040 分後", "0045 分後", "0050 分後", "0055 分後", "0060 分後"];

  @property()
  @renderable()
  private sliderLabel: string = "現在";

  private labelTexts = ["現在", "5分後", "10分後", "15分後", "20分後", "25分後", "30分後", "35分後", "40分後", "45分後", "50分後", "55分後", "1時間後"];

  private intervalTimeout: any;

  private playFlg: boolean = false;

  private isPlay: boolean = true;

  private isPause: boolean = false;

  postInitialize() {
    this.layer = this._initLayer();
  }

  render() {
    const dynamicHideClasses = {
      [CSS.hide]: this.isHide
    };
    const dynamicButtonClasses = {
      [CSS.play]: this.isPlay,
      [CSS.pause]: this.isPause
    }

    return (
      <div class={CSS.base} classes={dynamicHideClasses}>
        <div class={CSS.container}>
          <div class={CSS.item}>
            <input bind={this}
                  type="range"
                  min="0"
                  max="12"
                  step="1"
                  list="weatherinfo_tickmarks"
                  value={this.currIntervalStr}
                  onchange={this._sliderHandleChange} />
            <datalist id="weatherinfo_tickmarks">
              <option value="0" label="現在" />
              <option value="1" />
              <option value="2" />
              <option value="3" />
              <option value="4" />
              <option value="5" />
              <option value="6" label="30分後" />
              <option value="7" />
              <option value="8" />
              <option value="9" />
              <option value="10" />
              <option value="11" />
              <option value="12" label="1時間後" />
            </datalist>
          </div>
          <div class={CSS.item}>
            <div class={CSS.label}>
              {this.sliderLabel}
            </div>
            <div class={CSS.button} bind={this} onclick={this._HandleClick}>
              <span classes={dynamicButtonClasses} aria-label="play icon"></span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  private _initLayer() {
    const layer = new ImageryLayer({
      portalItem: {
        id: this.itemId
      },
      definitionExpression: "interval_text = '0000 分後'",
      visible: false,
      opacity: 0.6
    });
    this.view.map.add(layer);
    return layer;
  }

  private _sliderHandleChange(evt:any) {
    this.currInterval = Number(evt.target.value);
    this.sliderLabel = this.labelTexts[this.currInterval];
    const defExp = "interval_text = '" + this.intervalTexts[this.currInterval] + "'";
    this.layer.definitionExpression = defExp;
  }

  private _HandleClick() {
    if (!this.playFlg) {
      this.playTimeSlider();
      this.isPlay = false;
      this.isPause = true;
      this.playFlg = true;
    } else {
      clearTimeout(this.intervalTimeout);
      this.isPlay = true;
      this.isPause = false;
      this.playFlg = false;
    }
  }

  private playTimeSlider() {
    this.currIntervalStr = this.currInterval.toString();
    this.sliderLabel = this.labelTexts[this.currInterval];

    var defExp = "interval_text = '" + this.intervalTexts[this.currInterval] + "'";
    this.layer.definitionExpression = defExp;

    if (this.currInterval < 12) {
      this.currInterval++;
    } else {
      this.currInterval = 0;
    }
    this.intervalTimeout = setTimeout(this.playTimeSlider.bind(this), 3000);
  }

}

export = WeatherInfo;
