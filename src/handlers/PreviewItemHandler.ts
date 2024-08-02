import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { AiGifApp } from "../../AiGifApp";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IPreviewItemUtilityParams } from "../../definition/command/ICommandUtility";
import { ISlashCommandPreviewItem } from "@rocket.chat/apps-engine/definition/slashcommands/ISlashCommandPreview";
import { GifRequestDispatcher } from "../lib/GifRequestDispatcher";
import {
    sendGifToRoom,
    sendMessageVisibleToSelf,
    uploadGifToRoom,
} from "../utils/message";
import { InfoMessages } from "../enum/messages";
import { OnGoingGenPersistence } from "../persistence/OnGoingGenPersistence";
import { IPreviewId } from "../../definition/handlers/IPreviewId";
import { PreviewOrigin } from "../enum/PreviewOrigin";
import { GenerationPersistence } from "../persistence/GenerationPersistence";
import { uuid } from "../utils/uuid";

export class PreviewItemHandler {
    app: AiGifApp;
    item: ISlashCommandPreviewItem;
    sender: IUser;
    room: IRoom;
    read: IRead;
    modify: IModify;
    http: IHttp;
    persis: IPersistence;
    triggerId?: string | undefined;
    threadId?: string | undefined;

    constructor(props: IPreviewItemUtilityParams) {
        this.app = props.app;
        this.item = props.item;
        this.sender = props.sender;
        this.room = props.room;
        this.read = props.read;
        this.modify = props.modify;
        this.http = props.http;
        this.persis = props.persis;
        this.triggerId = props.triggerId;
        this.threadId = props.threadId;
    }

    async handleTextPreviewItem(): Promise<void> {
        const prompt = this.item.value;

        const dispatcher = new GifRequestDispatcher(
            this.app,
            this.http,
            this.read,
            this.modify,
            this.room,
            this.sender,
            this.threadId
        );

        if (!(await dispatcher.validatePreferences())) {
            return;
        }

        const res = await dispatcher.generateGif(prompt);

        const botUser: IUser = (await this.read
            .getUserReader()
            .getAppUser()) as IUser;

        if (res instanceof Error) {
            return sendMessageVisibleToSelf(
                this.modify,
                this.room,
                this.sender,
                botUser,
                this.threadId,
                `${InfoMessages.GENERATION_FAILED}\n${res.message}`
            );
        }
        sendMessageVisibleToSelf(
            this.modify,
            this.room,
            this.sender,
            botUser,
            this.threadId,
            `${InfoMessages.GENERATION_IN_PROGRESS}\nPrompt: ${prompt}`
        );

        const onGoingGenPeristence = new OnGoingGenPersistence(
            this.persis,
            this.read.getPersistenceReader()
        );

        await onGoingGenPeristence.add({
            generationId: res.id,
            prompt,
            roomId: this.room.id,
            threadId: this.threadId,
            uid: this.sender.id,
        });
    }

    async handleImagePreviewItem(): Promise<void> {
        const previewId: IPreviewId = JSON.parse(this.item.id);
        const prompt = previewId.prompt;
        const url = this.item.value;

        if (previewId.origin === PreviewOrigin.HISTORY) {
            return await sendGifToRoom(
                url,
                prompt,
                this.modify,
                this.room,
                this.sender
            );
        }

        // Received request from prompt generation, upload to room

        const resUrl = await uploadGifToRoom(
            url,
            prompt,
            this.http,
            this.modify,
            this.room,
            this.sender,
            this.app.getLogger()
        );

        if (resUrl) {
            const generationPersistence = new GenerationPersistence(
                this.sender.id,
                this.persis,
                this.read.getPersistenceReader()
            );

            await generationPersistence.add({
                id: uuid(),
                query: this.item.id,
                url: resUrl,
            });
        }
    }
}
