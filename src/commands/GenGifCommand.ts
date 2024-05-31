import {
    IRead,
    IModify,
    IHttp,
    IPersistence,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    ISlashCommand,
    SlashCommandContext,
} from "@rocket.chat/apps-engine/definition/slashcommands";
import { AiGifApp } from "../../AiGifApp";
import { sendMessageToRoom, sendMessageToSelf } from "../utils/message";
import { InfoMessages } from "../enum/InfoMessages";
import { GifRequestDispatcher } from "../lib/GifRequestDispatcher";
import { OnGoingGenPersistence } from "../persistence/OnGoingGenPersistence";

export class GenGifCommand implements ISlashCommand {
    command = "gen-gif";
    i18nParamsExample = "gen-gif your-prompt-here";
    i18nDescription = "Generate a gif based on your prompt";
    providesPreview = false;

    constructor(private readonly app: AiGifApp) {}

    async executor(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence
    ): Promise<void> {
        const dispatcher = new GifRequestDispatcher(
            this.app,
            http,
            read,
            modify,
            context.getRoom(),
            context.getSender(),
            context.getThreadId()
        );

        if (!(await dispatcher.validatePreferences())) {
            return;
        }

        const prompt = context.getArguments().join(" ").trim();

        if (!prompt && prompt.length > 0) {
            this.app.getLogger().log("No query found");
            return sendMessageToSelf(
                modify,
                context.getRoom(),
                context.getSender(),
                context.getThreadId()!,
                InfoMessages.NO_QUERY_FOUND
            );
        }

        // Real: 
        const res = await dispatcher.generateGif(prompt);

        // Mock: 
        // const id = Date.now().toLocaleString();
        // const res = await dispatcher.mockGenerateGif(prompt, id);

        if (res instanceof Error) {
            return sendMessageToSelf(
                modify,
                context.getRoom(),
                context.getSender(),
                context.getThreadId()!,
                `${InfoMessages.GENERATION_FAILED}\n${res.message}`
            );
        }

        //  messageId is required as we need to later update the message with the GIF
        // sending the message to everyone in the room so that the GIF doesn't show up abruptly to users
        const awaitMessageId = await sendMessageToRoom(
            modify,
            context.getRoom(),
            context.getSender(),
            context.getThreadId()!,
            `${InfoMessages.GENERATION_IN_PROGRESS}\nPrompt: ${prompt}`,
            ":hourglass_flowing_sand:"
        );

        const onGoingGenPeristence = new OnGoingGenPersistence(
            persis,
            read.getPersistenceReader()
        );

        await onGoingGenPeristence.add({
            generationId: res.id,
            prompt,
            roomId: context.getRoom().id,
            threadId: context.getThreadId()!,
            uid: context.getSender().id,
            awaitMessageId,
        });
    }
}