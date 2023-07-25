import http from '@ohos.net.http';
import image from '@ohos.multimedia.image';
import fileIo from '@ohos.fileio';
import { AGCApi } from '@hw-agconnect/api-ohos';
import '@hw-agconnect/auth-ohos';
import '@hw-agconnect/cloudstorage-ohos';

import { getAGConnect } from './AgcConfig';
import { Log } from '../common/Log';

const TAG = '[AGCStorage]';

export class AGCStorageReference {
    private maxFileSize: number = 2048 * 1024;
    agc: AGCApi;
    context: any;

    constructor(context) {
        this.context = context;
        this.agc = getAGConnect(context);
    }

    async uploadImage(user, file, progress: (percent: number) => void, done: (url: string) => void, error: (err: Error, showDialog: boolean) => void) {
        const storageManagement = this.agc.cloudStorage(this.agc.instance());
        const storageReference = await storageManagement.storageReference();
        const reference = storageReference.child(user.getUid().substr(0, 5) + "/" + file.displayName);
        try {
            const uploadTask = reference.putData(await this.readIntoBytes(file, error));
            uploadTask.on('progress', (uploadedSize: number, totalSize: number) => {
                const percent = (uploadedSize / totalSize) * 100;
                Log.info(TAG, 'progress: ' + percent);
                progress && progress(percent);
            });
            uploadTask.then(() => {
                Log.info(TAG, 'completed');
                reference.getDownloadURL().then((url) => {
                    Log.info(TAG, 'URL: ' + url);
                    done && done(url);
                }).catch((err) => {
                    Log.error(TAG, 'error' + err);
                    error && error(err, false);
                });
            }).catch((err) => {
                Log.error(TAG, 'error' + err);
                error && error(err, false);
            });
        } catch (e) {
            Log.info(TAG, 'FileError: ' + e.message);
        }
    }

    async readIntoBytes(file, error) {
        const bufferSize = 256 * 1024;
        let fd, readout;
        if (file.size > this.maxFileSize) {
            error && error(new Error("Image size can not greater than 2 MB."), true);
            return;
        }
        let filename = file.displayName;
        Log.info(TAG, 'displayname: ' + filename);

        if (filename.indexOf('.jpg') < 0) {
            error && error(new Error("Image must be a jpg, jpeg or png format."), true);
            return;
        }
        let buff = new ArrayBuffer(bufferSize);
        const arr = new Uint8Array(file.size);
        Log.info(TAG, 'FileSize: ' + file.size);
        fd = await file.open('r');
        for (let i = 0; i < file.size; i += buff.byteLength) {
            if (i + bufferSize > arr.byteLength) {
                Log.info(TAG, 'FileSize: i ' + i);
                buff = new ArrayBuffer(file.size % bufferSize);
                Log.info(TAG, 'FileSize: buff' + buff.byteLength);
            }
            readout = await fileIo.read(fd, buff, { offset: 0, length: buff.byteLength, position: i });
            arr.set(new Uint8Array(readout.buffer), i);
        }
        return arr;
    }

    async fetchNetworkImage(url: string) {
        let httpRequest = http.createHttp();

        let res = await httpRequest.request(url)
        let code = res.responseCode;
        if (code === 200) {
            // @ts-ignore
            let imageSource = image.createImageSource(res.result);
            let options = {
                alphaType: 0,
                editable: false,
                pixelFormat: 3,
                scaleMode: 1,
                size: { height: 100, width: 100 }
            };
            let pixmap = await imageSource.createPixelMap(options)
            return pixmap
        } else {
            Log.error(TAG, 'Error occurred, code is: ' + code);
        }
    }

    randomizeImageName(isPublic: boolean): string {
        let buffArr = [];
        let imageName = 'upload';
        imageName.split('').forEach(() => {
            buffArr.push(imageName.charAt(Math.floor(Math.random() * imageName.length)));
        });
        if (isPublic) {
            return 'http://agcstorage.com/' + buffArr.join('') + new Date().getTime().toString() + '.png';
        }

        return 'http://agcstorage.com/' + buffArr.join('') + '.png';
    }
}

