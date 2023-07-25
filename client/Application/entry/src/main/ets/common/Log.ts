import Logger from '@ohos.hilog';

export class Log {
    private static domain: number = 0x00;
    static info = (tag: string, format: string, ...args: any[]) => {
        Logger.info(Log.domain, tag, format, args);
    }
    static error = (tag: string, format: string, ...args: any[]) => {
        Logger.error(Log.domain, tag, format, args);
    }
}