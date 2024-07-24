import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { AiGifApp } from "../../AiGifApp";
import { RequestDebouncer } from "../../src/helper/RequestDebouncer";
import {
    ISlashCommandPreview,
    ISlashCommandPreviewItem,
} from "@rocket.chat/apps-engine/definition/slashcommands";

export interface ICommandUtilityParams {
    app: AiGifApp;
    params: Array<string>;
    sender: IUser;
    room: IRoom;
    read: IRead;
    modify: IModify;
    http: IHttp;
    persis: IPersistence;
    triggerId?: string;
    threadId?: string;
}

export interface ICommandUtility extends ICommandUtilityParams {
    resolveCommand(
        requestDebouncer: RequestDebouncer
    ): Promise<ISlashCommandPreview>;
    resolveExecutePreviewItem(item: ISlashCommandPreviewItem): Promise<void>;
}

export interface IPreviewerUtilityParams extends ICommandUtilityParams {
    requestDebouncer: RequestDebouncer;
}

export interface IPreviewItemUtilityParams extends Omit<ICommandUtilityParams, "params"> {
    item: ISlashCommandPreviewItem;
}
