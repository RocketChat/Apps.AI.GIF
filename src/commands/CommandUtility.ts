import {
    IRead,
    IModify,
    IHttp,
    IPersistence,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { AiGifApp } from "../../AiGifApp";
import {
    ICommandUtility,
    ICommandUtilityParams,
} from "../../definition/command/ICommandUtility";
import { RequestDebouncer } from "../helper/RequestDebouncer";
import { PreviewerHandler } from "../handlers/PreviewerHandler";
import {
    ISlashCommandPreview,
    ISlashCommandPreviewItem,
    SlashCommandPreviewItemType,
} from "@rocket.chat/apps-engine/definition/slashcommands";
import { PreviewItemHandler } from "../handlers/PreviewItemHandler";
import { sendMessageToSelf } from "../utils/message";
import { InfoMessages } from "../enum/InfoMessages";
import { Messages } from "../enum/Messages";

export class CommandUtility implements ICommandUtility {
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

    constructor(props: ICommandUtilityParams) {
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
    }

    async resolveCommand(
        requestDebouncer: RequestDebouncer
    ): Promise<ISlashCommandPreview> {
        const handler = new PreviewerHandler({
            app: this.app,
            params: this.params,
            sender: this.sender,
            room: this.room,
            read: this.read,
            modify: this.modify,
            http: this.http,
            persis: this.persis,
            triggerId: this.triggerId,
            threadId: this.threadId,
            requestDebouncer: requestDebouncer,
        });

        switch (this.params[0]) {
            case "p":
            case "prompt": {
                return await handler.executeCustomPrompt();
            }
            case "q":
            case "query": {
                return await handler.executePromptGeneration();
            }
            case "h":
            case "history": {
                if (
                    Number.isNaN(parseInt(this.params[1])) &&
                    this.params[1] !== undefined &&
                    this.params[1].length > 0
                ) {
                    await requestDebouncer.debouncedInvalidPageRequest(
                        this.modify,
                        this.room,
                        this.sender,
                        this.threadId
                    );
                } else {
                    const preview = await handler.executeHistory(this.params);
                    if (preview.items.length <= 0) {
                        const count = await handler.getHistoryItemCount();
                        const maxPage = Math.ceil(count / 10);

                        sendMessageToSelf(
                            this.modify,
                            this.room,
                            this.sender,
                            this.threadId,
                            InfoMessages.NO_ITEMS_FOUND_ON_PAGE + `${maxPage}.`
                        );
                    }
                    return preview;
                }
            }
            case "help": {
                sendMessageToSelf(
                    this.modify,
                    this.room,
                    this.sender,
                    this.threadId,
                    Messages.HELPER_TEXT + Messages.HELPER_COMMANDS
                );
            }
            default: {
                return {
                    i18nTitle: "PreviewTitle_Loading",
                    items: [],
                };
            }
        }
    }

    async resolveExecutePreviewItem(
        item: ISlashCommandPreviewItem
    ): Promise<void> {
        const handler = new PreviewItemHandler({
            app: this.app,
            item: item,
            sender: this.sender,
            room: this.room,
            read: this.read,
            modify: this.modify,
            http: this.http,
            persis: this.persis,
            triggerId: this.triggerId,
            threadId: this.threadId,
        });

        switch (item.type) {
            case SlashCommandPreviewItemType.TEXT: {
                await handler.requestGenerationFromPrompt();
                break;
            }
            case SlashCommandPreviewItemType.IMAGE: {
                await handler.sendGifToRoom();
                break;
            }
            default: {
                this.app.getLogger().log("Invalid preview item type");
                break;
            }
        }
    }
}
