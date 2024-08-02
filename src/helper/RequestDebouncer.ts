import {
    IHttp,
    ILogger,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { PromptVariationItem, RedefinedPrompt } from "../lib/RedefinePrompt";
import { GifRequestDispatcher } from "../lib/GifRequestDispatcher";
import { AiGifApp } from "../../AiGifApp";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { sendMessageVisibleToSelf } from "../utils/message";
import { ErrorMessages, InfoMessages } from "../enum/messages";

export class RequestDebouncer {
    // generic function to debounce multiple requests to the same function, ensures that only the last request is executed
    private debounce<T>(
        func: (...args: any[]) => Promise<T>,
        delay: number
    ): () => Promise<T> {
        let debounceTimer: NodeJS.Timeout | null = null;

        // store to resolve the current promise as undefined, if a new request is received
        let resolveCurrent: ((value?: any) => void) | null = null;

        return function (...args: any[]) {
            if (debounceTimer) {
                clearTimeout(debounceTimer);
                if (resolveCurrent) {
                    // received a new request, resolve the current promise as undefined
                    resolveCurrent(undefined);
                }
            }

            return new Promise<T>((resolve, reject) => {
                resolveCurrent = resolve;
                debounceTimer = setTimeout(async () => {
                    try {
                        const result = await func(...args);
                        resolve(result);
                    } catch (error) {
                        reject(error);
                    } finally {
                        debounceTimer = null;
                        resolveCurrent = null;
                    }
                }, delay);
            });
        };
    }

    /**
     * This function is a debounced version of the `requestPromptVariation` method.
     * It may throw an error if the request fails or any error occurs.
     *
     * @param args - The arguments for the request.
     * @param http - The HTTP utility to make requests.
     * @param logger - Logger for logging information.
     * @param sender - The user who sent the command.
     * @param room - The room where the command was sent.
     * @param modify - The modify utility to create messages.
     * @param threadId - The thread ID where the command was sent.
     * @returns {PromptVariationItem[]} The list of prompt variations.
     * @throws {Error} When the request or processing fails.
     */
    debouncedPromptVariationRequest: (
        args: string,
        http: IHttp,
        logger: ILogger,
        sender: IUser,
        room: IRoom,
        read: IRead,
        modify: IModify,
        threadId: string | undefined
    ) => Promise<PromptVariationItem[]> = this.debounce(
        async (
            args: string,
            http: IHttp,
            logger: ILogger,
            sender: IUser,
            room: IRoom,
            read: IRead,
            modify: IModify,
            threadId: string | undefined
        ) => {
            const redefinePrompt = new RedefinedPrompt();

            const profanityRes = await redefinePrompt.performProfanityCheck(
                args,
                sender.id,
                http,
                logger
            );
            const botUser: IUser = (await read
                .getUserReader()
                .getAppUser()) as IUser;

            if (profanityRes && profanityRes.containsProfanity) {
                sendMessageVisibleToSelf(
                    modify,
                    room,
                    sender,
                    botUser,
                    threadId,
                    InfoMessages.PROFANITY_FOUND_MESSAGE +
                        profanityRes.profaneWords.join(", ")
                );
                return [];
            }

            const data = await redefinePrompt.requestPromptVariation(
                args,
                http,
                sender.id,
                logger
            );

            if (!data) {
                sendMessageVisibleToSelf(
                    modify,
                    room,
                    sender,
                    botUser,
                    threadId,
                    ErrorMessages.PROMPT_VARIATION_FAILED
                );
            }

            return data;
        },
        2000
    );

    debouncedSyncGifRequest: (
        args: string,
        app: AiGifApp,
        http: IHttp,
        read: IRead,
        modify: IModify,
        persis: IPersistence,
        room: IRoom,
        sender: IUser,
        threadId: string | undefined
    ) => Promise<string | undefined> = this.debounce(
        async (
            args: string,
            app: AiGifApp,
            http: IHttp,
            read: IRead,
            modify: IModify,
            persis: IPersistence,
            room: IRoom,
            sender: IUser,
            threadId: string | undefined
        ) => {
            const gifRequestDispatcher = new GifRequestDispatcher(
                app,
                http,
                read,
                modify,
                room,
                sender,
                threadId
            );

            const res = await gifRequestDispatcher.syncGenerateGif(args);

            return res;
        },
        2000
    );

    debouncedInvalidPageRequest: (
        modify: IModify,
        room: IRoom,
        sender: IUser,
        botUser: IUser,
        threadId?: string | undefined
    ) => Promise<void> = this.debounce(
        async (
            modify: IModify,
            room: IRoom,
            sender: IUser,
            botUser: IUser,
            threadId?: string | undefined
        ) => {
            sendMessageVisibleToSelf(
                modify,
                room,
                sender,
                botUser,
                threadId,
                ErrorMessages.INVALID_PAGE_NUMBER
            );
        },
        2000
    );
}
