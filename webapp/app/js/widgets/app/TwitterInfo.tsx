/// <amd-dependency path="esri/core/tsSupport/declareExtendsHelper" name="__extends" />
/// <amd-dependency path="esri/core/tsSupport/decorateHelper" name="__decorate" />

import {subclass, declared, property} from "esri/core/accessorSupport/decorators";

import Widget = require("esri/widgets/Widget");

import { renderable, tsx } from "esri/widgets/support/widget";

interface TweetProps {
  key: string;
  profileImageUrl: string;
  name: string;
  screenName: string;
  text: string;
  retweetCount: number;
  favoriteCount: number;
  createdAt: string;
}

const CSS = {
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

@subclass("esri.widgets.TwitterInfo")
class TwitterInfo extends declared(Widget) {

  @property()
  @renderable()
  url: string;

  @property()
  @renderable()
  isHide: boolean = true;

  startQuery() {
    if (!this.timeoutId) {
      this._initQuery(false);
    }
  }

  stopQuery() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
      this.data = [];
    }
  }

  private timeoutId: any;

  @property()
  @renderable()
  private data: any = [];

  @property()
  @renderable()
  private type: string = 'all';

  render() {
    const dynamicClasses = {
      [CSS.hide]: this.isHide
    };

    const tweets = this.data.map((item:any) => {
      const createdAt = this._getData(item.created_at);
      const username = item.user.name + '@' + item.user.screen_name;
      return (
        <div  key={item.id.toString()}>
          <div class={CSS.tweetframe}>
            <img src={item.user.profile_image_url}/>
            <div class={CSS.tweetusername}>
              <div>{username}</div>
              <div>
                <img src="./img/icon.svg"/>
              </div>
            </div>
            <div class={CSS.tweettext}>
              <p>{item.text}</p>
            </div>
            <div class={CSS.tweetactions}>
              <span>
                <img src="./img/retweet.svg"/>
                {item.retweet_count}
              </span>
              <span>
                <img src="./img/favorite.svg"/>
                {item.favorite_count}
              </span>
              <span>{createdAt}</span>
            </div>
          </div>
          <hr />
        </div>
      );
    });

    const optionData = [{
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

    const options = optionData.map((item) => {
      return(
        <option key={item.value} value={item.value}>{item.label}</option>
      );
    });

    return (
      <div class={CSS.base} classes={dynamicClasses}>
        <div class={CSS.box}>
          <div class={CSS.tweetbox}>
            {tweets}
          </div>
          <div class={CSS.dropdownbox}>
            <select bind={this} value={this.type} onchange={this._handleChange}>
              {options}
            </select>
          </div>
        </div>
      </div>
    );
  }

  private _initQuery(change: boolean) {
    const target = this.type;
    const q = (target === 'all') ? '遅延'
            : (target === 'G') ? '遅延 銀座線'
            : (target === 'M') ? '遅延 丸ノ内線'
            : (target === 'H') ? '遅延 日比谷線'
            : (target === 'T') ? '遅延 東西線'
            : (target === 'C') ? '遅延 千代田線'
            : (target === 'Y') ? '遅延 有楽町線'
            : (target === 'Z') ? '遅延 半蔵門線'
            : (target === 'N') ? '遅延 南北線'
                                : '遅延 副都心線';
    const endpoint = this.url + '?q=' + q;

    fetch(endpoint).then((res) => {
      if (res.ok) {
        return res.json();
      } else {
        throw new Error();
      }
    }).then((json) => {
      let dataset;

      if (change) {
        dataset = json.statuses;
      } else {
        const filtered = json.statuses.filter((item:any) => {
          const status = this.data.some((d:any) => {
            return (d.id === item.id);
          });
          return (!status);
        });

        dataset = filtered.concat(this.data);
      }

      this.data = dataset;
    }).catch((err) => {
      throw new Error();
    });

    this.timeoutId = setTimeout(this._initQuery.bind(this, false), 10000);
  }

  private _getData(utcDate: string) {
    const date = new Date(utcDate);
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const h = date.getHours();
    let mi: number | string = date.getMinutes();
    let s: number | string = date.getSeconds();
    if (mi < 10) {
      mi = '0' + d;
    }
    if (s < 10) {
      s = '0' + s;
    }
    return y + '/' + m + '/' + d + ' ' + h + ':' + mi + ':' + s;
  }

  private _handleChange(evt: any) {
    this.type = evt.target.value;

    clearTimeout(this.timeoutId);
    this._initQuery(true);
  }

}

export = TwitterInfo;
