import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { AiGifApp } from "../../AiGifApp";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IPreviewerUtilityParams } from "../../definition/command/ICommandUtility";
import { RequestDebouncer } from "../helper/RequestDebouncer";
import {
    ISlashCommandPreview,
    SlashCommandPreviewItemType,
} from "@rocket.chat/apps-engine/definition/slashcommands/ISlashCommandPreview";

export class PreviewerHandler {
    app: AiGifApp;
    params: string[];
    sender: IUser;
    room: IRoom;
    read: IRead;
    modify: IModify;
    http: IHttp;
    persis: IPersistence;
    triggerId?: string | undefined;
    threadId?: string | undefined;
    requestDebouncer: RequestDebouncer;

    constructor(props: IPreviewerUtilityParams) {
        this.app = props.app;
        this.params = props.params;
        this.sender = props.sender;
        this.room = props.room;
        this.read = props.read;
        this.modify = props.modify;
        this.http = props.http;
        this.persis = props.persis;
        this.triggerId = props.triggerId;
        this.threadId = props.threadId;
        this.requestDebouncer = props.requestDebouncer;
    }

    async executeCustomPrompt(): Promise<ISlashCommandPreview> {
        const prompt = this.params[1];

        const res = await this.requestDebouncer.debouncedSyncGifRequest(
            prompt,
            this.app,
            this.http,
            this.read,
            this.modify,
            this.room,
            this.sender,
            this.threadId
        );

        if (!res) {
            return {
                i18nTitle: "PreviewTitle_Loading",
                items: [],
            };
        }

        return {
            i18nTitle: "PreviewTitle_Generated",
            items: [
                {
                    id: prompt,
                    type: SlashCommandPreviewItemType.IMAGE,
                    value: res,
                },
            ],
        };
    }

    async executePromptGeneration(): Promise<ISlashCommandPreview> {
        const prompt = this.params[1];

        const res = await this.requestDebouncer.debouncedPromptVariationRequest(
            prompt,
            this.http,
            this.app.getLogger(),
            this.sender.id
        );

        const items = res.map((item) => {
            return {
                id: item.prompt,
                type: SlashCommandPreviewItemType.TEXT,
                value: item.prompt,
            };
        });

        return {
            i18nTitle: "PreviewTitle_Generated",
            items,
        };
    }
}
