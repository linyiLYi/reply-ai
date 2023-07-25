import { AGConnectUser, } from '@hw-agconnect/auth-ohos';
import '@hw-agconnect/auth-ohos';
import { PhoneAuthProvider, VerifyCodeSettingBuilder } from '@hw-agconnect/auth-ohos';
import { AGCApi } from '@hw-agconnect/api-ohos';

import { Log } from '../common/Log';
import { getAGConnect } from './AgcConfig';

const TAG = "[AGCAuth]";

export class AGCAuth {
    agc: AGCApi;

    constructor(context) {
        this.agc = getAGConnect(context);
    }

    public getCurrentUser(): Promise<AGConnectUser> {
        return this.agc.auth().getCurrentUser();
    }

    public requestPhoneVerifyCode(ctrCode: string, phone: string) {
        let verifyCodeSettings = new VerifyCodeSettingBuilder()
            .setAction(1001)
            .setLang('zh_CN')
            .setSendInterval(60)
            .build();
        this.agc.auth().requestPhoneVerifyCode(
            ctrCode,
            phone,
            verifyCodeSettings).then((ret) => {
            Log.info(TAG, JSON.stringify({ "Verify Code Result: ": ret }));
        }).catch((error) => {
            Log.error(TAG, "Error: " + JSON.stringify(error));
        });
    }

    public async login(countryCode: string, phoneNumber: string, verifyCode: string): Promise<AgUser> {
        return new Promise((resolve, reject) => {
            const credential = PhoneAuthProvider.credentialWithVerifyCode(countryCode, phoneNumber, verifyCode);
            this.agc.auth().signIn(credential).then(async (ret) => {
                Log.info(TAG, "User has signed in..");
                // @ts-ignore
                let user = ret.getUser();
                let userExtra = await ret.getUser().getUserExtra();

                let loginRes = new AgUser(
                user.getUid(),
                user.getPhotoUrl(),
                user.getPhone(),
                user.getDisplayName(),
                userExtra.getCreateTime(),
                userExtra.getLastSignInTime())

                resolve(loginRes);
            }).catch((error) => {
                Log.error(TAG, "Error: ", error);
                reject(error);
            });
        });
    }

    public async logout(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            this.agc.auth().signOut().then(() => {
                resolve(true);
            }).catch((error) => {
                Log.error(TAG, "error", error);
                reject(error);
            });
        });
    }

    public async deleteUser(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.agc.auth().deleteUser().then(() => {
                resolve(true);
            }).catch((error) => {
                Log.error(TAG, "error", error);
                reject(error);
            });
        });
    }
}

export class AgUser {
    uid: String;
    photoUrl: String;
    phone: String;
    displayName: String;
    registerDate: String;
    lastLogin: String;

    constructor(uid: String ="", photoUrl: String = "", phone: String= "", displayName: String="", registerDate: String="", lastLogin: String="") {
        this.uid = uid;
        this.photoUrl = photoUrl;
        this.phone = phone;
        this.displayName = displayName;
        this.registerDate = registerDate;
        this.lastLogin = lastLogin;
    }

    getUid(): String {
        return this.uid;
    }

    getPhone(): String {
        return this.phone;
    }

    getDisplayName(): String {
        return this.displayName;
    }

    getPhotoUrl(): String {
        return this.photoUrl;
    }

    getRegisterDate(): String {
        return this.registerDate;
    }

    getLastLogin(): String {
        return this.lastLogin;
    }
}
