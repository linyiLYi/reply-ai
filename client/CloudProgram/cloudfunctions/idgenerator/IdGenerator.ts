import * as crypto from 'crypto';

let myHandler = async function (event, context, callback, logger) {
    const uuid = crypto.randomUUID();

    let res = new context.HTTPResponse({ "uuid": uuid }, {
        "faas-content-type": "json"
    }, "application/json", "200");

    logger.info(`Generated UUID: ${uuid}`);

    callback(res);
};

export { myHandler }