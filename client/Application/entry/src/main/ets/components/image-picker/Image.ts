/*
 * Copyright (c) 2022 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import image from '@ohos.multimedia.image';
import mediaLibrary from '@ohos.multimedia.mediaLibrary';

import { Log } from '../../common/Log';

const TAG = '[ImageModel]';

export class PictureItem {
    public index: number;
    public pixelMap: image.PixelMap;

    constructor(index: number, pixelMap: image.PixelMap) {
        this.index = index;
        this.pixelMap = pixelMap;
    }
}

export default class ImageModel {
    private media: mediaLibrary.MediaLibrary = undefined;

    constructor(context: any) {
        // @ts-ignore
        this.media = mediaLibrary.getMediaLibrary(context);
    }

    async getAllImg() {
        let fileKeyObj = mediaLibrary.FileKey;
        let fetchOp = {
            // @ts-ignore
            selections: fileKeyObj.MEDIA_TYPE + '=?',
            // @ts-ignore
            selectionArgs: [`${mediaLibrary.MediaType.IMAGE}`],
        };
        let mediaList: Array<mediaLibrary.FileAsset> = [];
        // @ts-ignore
        const fetchFileResult = await this.media.getFileAssets(fetchOp);
        Log.info(TAG, `queryFile getFileAssetsFromType fetchFileResult.count = ${fetchFileResult.getCount()}`);
        if (fetchFileResult.getCount() > 0) {
            mediaList = await fetchFileResult.getAllObject();
        }
        return mediaList;
    }
}