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
import { uploadGifToRoom, sendMessageToSelf } from "../utils/message";
import { InfoMessages } from "../enum/InfoMessages";
import { OnGoingGenPersistence } from "../persistence/OnGoingGenPersistence";
import { GenerationPersistence } from "../persistence/GenerationPersistence";
import { uuid } from "../utils/uuid";

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
            switch (actionId) {
                case ButtonActionIds.APPROVE: {
                    const resUrl = await uploadGifToRoom(
                        args.url,
                        args.prompt,
                        this.http,
                        this.modify,
                        room,
                        user,
                        this.app.getLogger()
                    );

                    if (resUrl) {
                        const generationPersistence = new GenerationPersistence(
                            user.id,
                            this.persis,
                            this.read.getPersistenceReader()
                        );

                        await generationPersistence.add({
                            id: uuid(),
                            query: args.prompt,
                            url: resUrl,
                        });
                    }
                    break;
                }
                case ButtonActionIds.REGENERATE: {
                    await this.regenerateGif(room, user, args.prompt);
                    break;
                }
            }
        }
        return this.context.getInteractionResponder().successResponse();
    }

    async regenerateGif(room: IRoom, user: IUser, prompt: string) {
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
