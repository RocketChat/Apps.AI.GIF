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
import { sendMessageToSelf } from "../utils/message";
import { InfoMessages } from "../enum/InfoMessages";
import { OnGoingGenPersistence } from "../persistence/OnGoingGenPersistence";

export class PreviewItemHandler {
    app: AiGifApp;
    params: string[];
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
        this.params = props.params;
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

    async sendGifToRoom(): Promise<void> {
        const prompt = this.item.id;

        const message = this.modify.getCreator().startMessage({
            room: this.room,
            sender: this.sender,
            attachments: [
                {
                    title: { value: prompt },
                    imageUrl: this.item.value,
                },
            ],
        });

        await this.modify.getCreator().finish(message);

        return;
    }

    async requestGenerationFromPrompt(): Promise<void> {
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

        if (res instanceof Error) {
            return sendMessageToSelf(
                this.modify,
                this.room,
                this.sender,
                this.threadId,
                `${InfoMessages.GENERATION_FAILED}\n${res.message}`
            );
        }

        sendMessageToSelf(
            this.modify,
            this.room,
            this.sender,
            this.threadId,
            `${InfoMessages.GENERATION_IN_PROGRESS}\nPrompt: ${prompt}`,
            ":hourglass_flowing_sand:"
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
}
