import {
    IUIKitResponse,
    UIKitBlockInteractionContext,
} from "@rocket.chat/apps-engine/definition/uikit";
import { AiGifApp } from "../../AiGifApp";
import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { ButtonActionIds, ButtonBlockIds } from "../enum/Identifiers";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { GifRequestDispatcher } from "../lib/GifRequestDispatcher";
import { sendMessageToSelf } from "../utils/message";
import { InfoMessages } from "../enum/InfoMessages";
import { OnGoingGenPersistence } from "../persistence/OnGoingGenPersistence";

export class ExecuteBlockActionHandler {
    private context: UIKitBlockInteractionContext;
    constructor(
        protected readonly app: AiGifApp,
        protected readonly read: IRead,
        protected readonly http: IHttp,
        protected readonly persis: IPersistence,
        protected readonly modify: IModify,
        context: UIKitBlockInteractionContext
    ) {
        this.context = context;
    }

    public async handleActions(): Promise<IUIKitResponse> {
        const { actionId, user, room, blockId, value } =
            this.context.getInteractionData();

        if (!user || !room || !value) {
            this.app.getLogger().error("Invalid data received in block action");
            return this.context.getInteractionResponder().errorResponse();
        }

        const args: {
            prompt: string;
            url: string;
        } = JSON.parse(value);

        if (blockId === ButtonBlockIds.REGENERATE_OPTIONS_BLOCK) {
            if (actionId === ButtonActionIds.APPROVE && value && room) {
                await this.sendGifToRoom({
                    modify: this.modify,
                    room,
                    user,
                    prompt: args.prompt,
                    url: args.url,
                });
            } else if (
                actionId === ButtonActionIds.REGENERATE &&
                value &&
                room
            ) {
                await this.regenerateGif({
                    room,
                    user,
                    prompt: args.prompt,
                });
            }
        }
        return this.context.getInteractionResponder().successResponse();
    }

    async sendGifToRoom({
        modify,
        room,
        user,
        prompt,
        url,
    }: {
        modify: IModify;
        room: IRoom;
        user: IUser;
        prompt: string;
        url: string;
    }) {
        const messageBuilder = this.modify
            .getCreator()
            .startMessage()
            .setRoom(room)
            .setSender(user)
            .setText(`Prompt: ${prompt}`)
            .setAttachments([
                {
                    title: { value: prompt },
                    imageUrl: url,
                },
            ]);

        await modify.getCreator().finish(messageBuilder);
    }

    async regenerateGif({
        room,
        user,
        prompt,
    }: {
        room: IRoom;
        user: IUser;
        prompt: string;
    }) {
        const dispatcher = new GifRequestDispatcher(
            this.app,
            this.http,
            this.read,
            this.modify,
            room,
            user,
            undefined
        );

        const res = await dispatcher.generateGif(prompt);

        if (res instanceof Error) {
            return sendMessageToSelf(
                this.modify,
                room,
                user,
                undefined,
                `${InfoMessages.GENERATION_FAILED}\n${res.message}`
            );
        }

        sendMessageToSelf(
            this.modify,
            room,
            user,
            undefined,
            `${InfoMessages.GENERATION_IN_PROGRESS}\nPrompt: ${prompt}`,
            ":hourglass_flowing_sand:"
        );

        const onGoingGenPeristence = new OnGoingGenPersistence(
            this.persis,
            this.read.getPersistenceReader()
        );

        await onGoingGenPeristence.add({
            generationId: res.id,
            prompt: prompt,
            roomId: room.id,
            threadId: undefined,
            uid: user.id,
        });
    }
}
