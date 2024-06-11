import {
    IHttp,
    IModify,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { getSettingFromId } from "../utils/prefs";
import { Preferences } from "../enum/Preferences";
import { IGifRequestBody } from "../../definition/lib/IGifRequestBody";
import {
    IGifResponseData,
    PredictionStatus,
} from "../../definition/lib/IGifResponseData";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { sendMessageToSelf } from "../utils/message";
import { AiGifApp } from "../../AiGifApp";
import { InfoMessages } from "../enum/InfoMessages";

export class GifRequestDispatcher {
    constructor(
        private readonly app: AiGifApp,
        private readonly http: IHttp,
        private readonly read: IRead,
        private readonly modify: IModify,
        private readonly room: IRoom,
        private readonly sender: IUser,
        private readonly threadId: string | undefined
    ) {}

    async validatePreferences(): Promise<boolean> {
        const apiKey = await getSettingFromId(this.read, Preferences.API_KEY);
        const webhookUrl = await getSettingFromId(
            this.read,
            Preferences.WEBHOOK_URL
        );
        const apiUrl = await getSettingFromId(this.read, Preferences.API_URL);
        const modelId = await getSettingFromId(this.read, Preferences.MODEL_ID);

        const settings = [
            {
                key: Preferences.API_KEY,
                value: apiKey,
                message: InfoMessages.API_KEY_NOT_SET,
            },
            {
                key: Preferences.WEBHOOK_URL,
                value: webhookUrl,
                message: InfoMessages.WEBHOOK_URL_NOT_SET,
            },
            {
                key: Preferences.API_URL,
                value: apiUrl,
                message: InfoMessages.API_URL_NOT_SET,
            },
            {
                key: Preferences.MODEL_ID,
                value: modelId,
                message: InfoMessages.MODEL_ID_NOT_SET,
            },
        ];

        for (const setting of settings) {
            if (!setting.value || setting.value === "") {
                this.app.getLogger().log(setting.message);
                sendMessageToSelf(
                    this.modify,
                    this.room,
                    this.sender,
                    this.threadId,
                    setting.message
                );
                return false;
            }

            if (
                setting.key === Preferences.WEBHOOK_URL ||
                setting.key === Preferences.API_URL
            ) {
                try {
                    new URL(setting.value);
                } catch (e) {
                    const errorMessage = `Invalid URL assigned to ${setting.key}: ${setting.value}`;
                    this.app.getLogger().log(errorMessage);
                    sendMessageToSelf(
                        this.modify,
                        this.room,
                        this.sender,
                        this.threadId,
                        errorMessage
                    );
                    return false;
                }
            }
        }

        return true;
    }

    async generateGif(prompt: string): Promise<IGifResponseData | Error> {
        const apiUrl = await getSettingFromId(this.read, Preferences.API_URL);
        const apiKey = await getSettingFromId(this.read, Preferences.API_KEY);
        const modelId = await getSettingFromId(this.read, Preferences.MODEL_ID);
        const webhookUrl = await getSettingFromId(
            this.read,
            Preferences.WEBHOOK_URL
        );

        if (!apiKey || !apiUrl || !modelId || !webhookUrl) {
            const errorMessage =
                "ValidationError: One or more preferences are not set";
            this.app.getLogger().log(errorMessage);
            throw new Error(errorMessage);
        }

        const requestBody: IGifRequestBody = {
            version: modelId,
            webhook: webhookUrl,
            input: {
                mp4: false,
                steps: 30,
                width: 672,
                height: 384,
                prompt,
                negative_prompt: "blurry",
            },
        };

        const res = await this.http.post(apiUrl, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            data: requestBody,
        });

        if (!res || !res.data || res.statusCode !== 201) {
            const responseData = res.data as IGifResponseData;

            if (
                responseData.status === PredictionStatus.FAILED ||
                responseData.status === PredictionStatus.CANCELLED
            ) {
                this.app.getLogger().log(responseData.error);
                throw new Error(responseData.error);
            }
        }

        return res.data as IGifResponseData;
    }

    async mockGenerateGif(
        prompt: string,
        id: string
    ): Promise<IGifResponseData> {
        const webhookUrl = await getSettingFromId(
            this.read,
            Preferences.WEBHOOK_URL
        );

        console.log("Mocking generation of gif", webhookUrl);

        setTimeout(() => {
            this.http.post(webhookUrl!, {
                data: {
                    id,
                    output: "https://i.giphy.com/vzO0Vc8b2VBLi.gif",
                },
            });
        }, 5000);

        return {
            id: id,
            status: PredictionStatus.SUCCEEDED,
            error: "",
        };
    }
}
