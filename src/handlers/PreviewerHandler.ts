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
import { GenerationPersistence } from "../persistence/GenerationPersistence";

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
            this.persis,
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

        const uuid = Math.floor(Date.now() * Math.random());
        return {
            i18nTitle: "PreviewTitle_Generated",
            items: [
                {
                    id: uuid + "://" + prompt,
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

    async executeHistory(params: string[]): Promise<ISlashCommandPreview> {
        let page = 0;

        if (params.length > 1 && !Number.isNaN(parseInt(params[1]))) {
            page = parseInt(params[1]);
        }

        const generationPersistence = new GenerationPersistence(
            this.sender.id,
            this.persis,
            this.read.getPersistenceReader()
        );

        const gifs = await generationPersistence.getItemsForPage(page);

        return {
            i18nTitle: "PreviewTitle_Past_Creations",
            items: gifs.map((gif) => ({
                id: gif.id + "://" + gif.query,
                type: SlashCommandPreviewItemType.IMAGE,
                value: gif.url,
            })),
        };
    }
}
