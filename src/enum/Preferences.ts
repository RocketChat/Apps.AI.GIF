import {
    ISetting,
    SettingType,
} from "@rocket.chat/apps-engine/definition/settings";

export enum Preferences {
    API_KEY = "api_key",
    WEBHOOK_URL = "webhook_url",
}

export const settings: Array<ISetting> = [
    {
        id: Preferences.API_KEY,
        type: SettingType.STRING,
        packageValue: "",
        required: true,
        public: false,
        i18nLabel: "API Key",
        multiline: false,
        i18nPlaceholder: "your-api-key-here",
    },
    {
        id: Preferences.WEBHOOK_URL,
        type: SettingType.STRING,
        packageValue: "",
        required: true,
        public: false,
        i18nLabel: "Webhook URL",
        multiline: false,
        i18nPlaceholder: "your-webhook-url-here",
    },
];
