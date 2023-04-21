"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const TabManager_1 = require("./TabManager");
function activate(context) {
    new TabManager_1.default(context);
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map