"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.containerMessageOptions = exports.containerDetailsOptions = void 0;
var utils_1 = require("markdown-it/lib/common/utils");
// containers
// ref: https://github.com/markdown-it/markdown-it-container
// ::: details Detail
//   summary comes here
// :::
exports.containerDetailsOptions = {
    validate: function (params) {
        return /^details\s+(.*)$/.test(params.trim());
    },
    render: function (tokens, idx) {
        var m = tokens[idx].info.trim().match(/^details\s+(.*)$/);
        var summary = (m === null || m === void 0 ? void 0 : m[1]) || '';
        if (tokens[idx].nesting === 1) {
            // opening tag
            return ('<details><summary>' +
                (0, utils_1.escapeHtml)(summary) +
                '</summary><div class="details-content">');
        }
        else {
            // closing tag
            return '</div></details>\n';
        }
    },
};
// ::: message alert
//   text
// :::
var msgClassRegex = /^message\s*(alert)?$/;
exports.containerMessageOptions = {
    validate: function (params) {
        return msgClassRegex.test(params.trim());
    },
    render: function (tokens, idx) {
        var m = tokens[idx].info.trim().match(msgClassRegex);
        var messageName = (m === null || m === void 0 ? void 0 : m[1]) === 'alert' ? 'alert' : 'message';
        if (tokens[idx].nesting === 1) {
            // opening tag
            var icon = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 101 101\" role=\"img\" aria-label=\"".concat(messageName, "\" class=\"msg-icon\"><circle cx=\"51\" cy=\"51\" r=\"50\" fill=\"currentColor\"></circle><text x=\"50%\" y=\"50%\" text-anchor=\"middle\" fill=\"#ffffff\" font-size=\"70\" font-weight=\"bold\" dominant-baseline=\"central\">!</text></svg>");
            return "<aside class=\"msg ".concat(messageName, "\">").concat(icon, "<div class=\"msg-content\">");
        }
        else {
            // closing tag
            return "</div></aside>\n";
        }
    },
};
