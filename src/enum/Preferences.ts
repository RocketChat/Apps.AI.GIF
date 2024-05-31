import {
    ISetting,
    SettingType,
} from "@rocket.chat/apps-engine/definition/settings";

export enum Preferences {
    API_KEY = "api_key",
    WEBHOOK_URL = "webhook_url",
    API_URL = "api_url",
    MODEL_ID = "model_id",
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
    {
        id: Preferences.API_URL,
        type: SettingType.STRING,
        packageValue: "https://api.replicate.com/v1/predictions",
        required: true,
        public: false,
        i18nLabel: "API URL",
        multiline: false,
        i18nPlaceholder: "api-url-here",
    },
    {
        id: Preferences.MODEL_ID,
        type: SettingType.STRING,
        packageValue: "78b3a6257e16e4b241245d65c8b2b81ea2e1ff7ed4c55306b511509ddbfd327a",
        required: true,
        public: false,
        i18nLabel: "Model ID",
        multiline: false,
        i18nPlaceholder: "model-id-here",
    },
];
