"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const { default: server } = require("./server");
const AWS = require('aws-sdk');
exports.handler = function (event, context) {
    return __awaiter(this, void 0, void 0, function* () {
        // event: contains infomration from the invoker, passed as a JSON-formatted string.
        console.log("EVENT: \n" + JSON.stringify(event, null, 2));
        let service = yield server();
        try {
            let results = yield service.matcher(JSON.parse(event.body).patientData);
            return { "statusCode": 200, "body": JSON.stringify(results), "headers": {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
                    'Access-Control-Allow-Headers': 'Cache-Control, Pragma, Origin, Authorization, Content-Type, X-Requested-With, WU-Api-Key, WU-Api-Secret'
                } };
        }
        catch (ex) {
            console.log("EXCEPTION:" + ex);
            return { "statusCode": 500, "body": JSON.stringify(ex), "headers": {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
                    'Access-Control-Allow-Headers': 'Cache-Control, Pragma, Origin, Authorization, Content-Type, X-Requested-With, WU-Api-Key, WU-Api-Secret'
                } };
        }
    });
};
//# sourceMappingURL=index.js.map