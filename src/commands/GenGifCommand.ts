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
import { sendMessageToSelf } from "../utils/message";
import { InfoMessages } from "../enum/InfoMessages";
import { GifRequestDispatcher } from "../lib/GifRequestDispatcher";
import { OnGoingGenPersistence } from "../persistence/OnGoingGenPersistence";

export class GenGifCommand implements ISlashCommand {
    public command = "gen-gif";
    public i18nParamsExample = "GenGIFCommandExample";
    public i18nDescription = "GenGIFCommandDescription";
    public providesPreview = false;

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

        // Expect the user to enter the prompt in double quotes
        const prompt = context.getArguments()[0].trim();

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

        // const res = await dispatcher.generateGif(prompt);
        const id = Date.now().toLocaleString();
        const res = await dispatcher.mockGenerateGif(prompt, id);

        if (res instanceof Error) {
            return sendMessageToSelf(
                modify,
                context.getRoom(),
                context.getSender(),
                context.getThreadId()!,
                `${InfoMessages.GENERATION_FAILED}\n${res.message}`
            );
        }

        sendMessageToSelf(
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
            threadId: context.getThreadId(),
            uid: context.getSender().id,
        });
    }
}
