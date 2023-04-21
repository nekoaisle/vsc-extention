"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateInfo = void 0;
const Util_1 = require("./Util");
/**
 * 日時情報クラス
 */
class DateInfo {
    constructor(date) {
        // キャッシュ
        // cache['year'  ]  年 "YYYY"
        // cache['month' ]  月 "MM"
        // cache['date'  ]  日 "DD"
        // cache['hour'  ]  時 "HH"
        // cache['min'   ]  分 "II"
        // cache['sec'   ]  秒 "SS"
        // cache['ymd'   ]  日付 "YYYY-MM-DD"
        // cache['his'   ]  時刻 "HH:II:SS"
        // cache['ymdhis']  日時 "YYYY-MM-DD HH:II:SS"
        this.cache = {};
        switch (Util_1.Util.getClassName(date)) {
            case 'Date': {
                this.value = date;
                break;
            }
            case 'Number': {
                this.value = new Date(date);
                break;
            }
            case 'String': {
                // ISO-8601 は - のはずなんだけどなぁ…
                let value = date.replace(/-/g, '/');
                this.value = new Date(value);
                break;
            }
            // 上記以外は全て現在時刻	
            case 'Null':
            case 'Undefined':
            default: {
                this.value = new Date();
                break;
            }
        }
    }
    /**
     * キャッシュから値を取得
     * @param key キャッシュのキー
     * @param callback キャッシュが存在しないときに呼び出す関数
     */
    getCache(key, callback) {
        if (this.cache[key]) {
            // キャッシュに存在した
            return this.cache[key];
        }
        else {
            // キャッシュに存在しなかった
            return callback();
        }
    }
    /**
     * 上位互換のための get 群
     */
    get year() {
        return this.getCache('year', () => {
            return Util_1.Util.padNum(this.value.getFullYear(), 4);
        });
    }
    get month() {
        return this.getCache('month', () => {
            return Util_1.Util.padNum(this.value.getMonth() + 1, 2);
        });
    }
    get date() {
        return this.getCache('date', () => {
            return Util_1.Util.padNum(this.value.getDate(), 2);
        });
    }
    get hour() {
        return this.getCache('hour', () => {
            return Util_1.Util.padNum(this.value.getHours(), 2);
        });
    }
    get min() {
        return this.getCache('min', () => {
            return Util_1.Util.padNum(this.value.getMinutes(), 2);
        });
    }
    get sec() {
        return this.getCache('sec', () => {
            return Util_1.Util.padNum(this.value.getSeconds(), 2);
        });
    }
    get ymd() {
        return `${this.year}-${this.month}-${this.date}`;
    }
    get his() {
        return `${this.hour}:${this.min}:${this.sec}`;
    }
    get ymdhis() {
        return `${this.ymd} ${this.his}`;
    }
    /**
     * フォーマットを指定して文字列に変換
     *
     * 例: di.format("%Y-%M-%D %H:%I:%S")
     *     "2019-09-30 14:15:23"
     *
     * @param format 書式文字列
     * @return string 書式に従って作成した文字列
     */
    format(format) {
        let ret = '';
        let last = null;
        for (let i = 0; i < format.length; ++i) {
            let c = format.charAt(i);
            if (last === '%') {
                switch (c) {
                    // ４桁の年
                    case 'Y': {
                        c = Util_1.Util.padNum(this.value.getFullYear(), 4);
                        break;
                    }
                    // ２桁の年
                    case 'y': {
                        let y = this.value.getFullYear() % 100;
                        c = Util_1.Util.padNum(y, 2);
                        break;
                    }
                    // ２桁の月
                    case 'M': {
                        c = Util_1.Util.padNum(this.value.getMonth() + 1, 2);
                        break;
                    }
                    // ０パディングなしの月
                    case 'M': {
                        c = "" + (this.value.getMonth() + 1);
                        break;
                    }
                    // ２桁の日
                    case 'D': {
                        c = Util_1.Util.padNum(this.value.getDate(), 2);
                        break;
                    }
                    // ０パディングなしの日
                    case 'd': {
                        c = "" + (this.value.getDate());
                        break;
                    }
                    // ２桁の時
                    case 'H': {
                        c = Util_1.Util.padNum(this.value.getHours(), 2);
                        break;
                    }
                    // ０パディングなしの時
                    case 'h': {
                        c = Util_1.Util.padNum(this.value.getHours(), 2);
                        break;
                    }
                    // ２桁の分
                    case 'I': {
                        c = Util_1.Util.padNum(this.value.getMinutes(), 2);
                        break;
                    }
                    // ０パディングなしの分
                    case 'i': {
                        c = Util_1.Util.padNum(this.value.getMinutes(), 2);
                        break;
                    }
                    // ２桁の秒
                    case 'S': {
                        c = Util_1.Util.padNum(this.value.getSeconds(), 2);
                        break;
                    }
                    // ０パディングなしの秒
                    case 's': {
                        c = Util_1.Util.padNum(this.value.getSeconds(), 2);
                        break;
                    }
                }
                last = null;
            }
            else if (c === '%') {
                last = c;
                continue;
            }
            ret += c;
        }
        return ret;
    }
}
exports.DateInfo = DateInfo;
//# sourceMappingURL=DateInfo.js.map