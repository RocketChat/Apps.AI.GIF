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
    ISlashCommandPreviewItem,
    SlashCommandPreviewItemType,
} from "@rocket.chat/apps-engine/definition/slashcommands/ISlashCommandPreview";
import { GenerationPersistence } from "../persistence/GenerationPersistence";
import { uuid } from "../utils/uuid";
import { RedefinedPrompt } from "../lib/RedefinePrompt";
import { sendMessageToSelf } from "../utils/message";
import { InfoMessages } from "../enum/InfoMessages";
import { PreviewOrigin } from "../enum/PreviewOrigin";
import { IPreviewId } from "../../definition/handlers/IPreviewId";

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

        const redefinePrompt = new RedefinedPrompt();

        const profanityRes = await redefinePrompt.performProfanityCheck(
            prompt,
            this.sender.id,
            this.http,
            this.app.getLogger()
        );

        if (profanityRes && profanityRes.containsProfanity) {
            sendMessageToSelf(
                this.modify,
                this.room,
                this.sender,
                this.threadId,
                InfoMessages.PROFANITY_FOUND_MESSAGE +
                    profanityRes.profaneWords.join(", ")
            );
            return {
                i18nTitle: "PreviewTitle_Profanity_Error",
                items: [],
            };
        }

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

        const previewId: IPreviewId = {
            id: uuid(),
            prompt,
            origin: PreviewOrigin.PROMPT_GENERATION,
        };

        return {
            i18nTitle: "PreviewTitle_Generated",
            items: [
                {
                    id: JSON.stringify(previewId),
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
            this.sender,
            this.room,
            this.modify,
            this.threadId
        );
        let items: ISlashCommandPreviewItem[] = [];

        if (res) {
            items = res.map((item) => {
                return {
                    id: item.prompt,
                    type: SlashCommandPreviewItemType.TEXT,
                    value: item.prompt,
                };
            });
        }
        return {
            i18nTitle: "PreviewTitle_Generated",
            items,
        };
    }

    async executeHistory(params: string[]): Promise<ISlashCommandPreview> {
        let page = 0;

        if (params.length > 1 && !Number.isNaN(parseInt(params[1]))) {
            page = parseInt(params[1]);

            if (page > 0) page--;
        }

        const generationPersistence = new GenerationPersistence(
            this.sender.id,
            this.persis,
            this.read.getPersistenceReader()
        );

        const gifs = await generationPersistence.getItemsForPage(page);

        return {
            i18nTitle: "PreviewTitle_Past_Creations",
            items: gifs.map((gif) => {
                const previewId: IPreviewId = {
                    id: gif.id,
                    prompt: gif.query,
                    origin: PreviewOrigin.HISTORY,
                };

                return {
                    id: JSON.stringify(previewId),
                    type: SlashCommandPreviewItemType.IMAGE,
                    value: gif.url,
                };
            }),
        };
    }

    async getHistoryItemCount(): Promise<number> {
        const generationPersistence = new GenerationPersistence(
            this.sender.id,
            this.persis,
            this.read.getPersistenceReader()
        );

        const gifs = await generationPersistence.getAllItems();

        return gifs.length;
    }
}
