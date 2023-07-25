import agconnect from '@hw-agconnect/api-ohos';
import "@hw-agconnect/core-ohos";
import "@hw-agconnect/auth-ohos";

import { Log } from '../common/Log';

const TAG = "[AGCConfig]";

export function getAGConnect(context) {
    try {
        agconnect.instance().init(context);
        Log.info(TAG, "init AGC SDK success");
        return agconnect;
    }
    catch (err) {
        Log.error(TAG, "initAgcSDK failed" + err);
    }
}