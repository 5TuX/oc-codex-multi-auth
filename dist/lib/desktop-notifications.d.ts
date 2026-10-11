type NotificationCallback = (error: Error | null) => void;
type ExecuteFile = (file: string, args: string[], options: {
    timeout: number;
    windowsHide: boolean;
}, callback: NotificationCallback) => unknown;
export type DesktopNotifier = (title: string, message: string) => Promise<boolean>;
export declare function isDesktopNotificationSupported(platform?: NodeJS.Platform): boolean;
export declare function createDesktopNotifier(options?: {
    platform?: NodeJS.Platform;
    executeFile?: ExecuteFile;
}): DesktopNotifier;
export declare const sendDesktopNotification: DesktopNotifier;
export {};
