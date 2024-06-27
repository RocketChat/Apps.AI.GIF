import {
    IRead,
    IModify,
    IHttp,
    IPersistence,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    ISlashCommand,
    ISlashCommandPreview,
    ISlashCommandPreviewItem,
    SlashCommandContext,
    SlashCommandPreviewItemType,
} from "@rocket.chat/apps-engine/definition/slashcommands";
import { AiGifApp } from "../../AiGifApp";
import { sendMessageToSelf } from "../utils/message";
import { ErrorMessages, InfoMessages } from "../enum/InfoMessages";
import { GifRequestDispatcher } from "../lib/GifRequestDispatcher";
import { OnGoingGenPersistence } from "../persistence/OnGoingGenPersistence";
import { PromptVariationItem } from "../lib/RedefinePrompt";
import { RequestDebouncer } from "../helper/RequestDebouncer";

export class GenGifCommand implements ISlashCommand {
    public command = "gen-gif";
    public i18nParamsExample = "GenGIFCommandExample";
    public i18nDescription = "GenGIFCommandDescription";
    public providesPreview = true;

    requestDebouncer = new RequestDebouncer();
    constructor(private readonly app: AiGifApp) {}

    executor(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence
    ): Promise<void> {
        throw new Error("Method not implemented.");
    }

    async executePreviewItem?(
        item: ISlashCommandPreviewItem,
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence
    ): Promise<void> {
        const prompt = item.value;

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

        const res = await dispatcher.generateGif(prompt);

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

    async previewer(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence
    ): Promise<ISlashCommandPreview> {
        let args = context.getArguments()[0].trim();

        try {
            const res = await this.requestDebouncer.debouncedGetRequest(
                args,
                http,
                this.app.getLogger(),
                context
            );

            if (!res) {
                return {
                    i18nTitle: "PreviewTitle_Loading",
                    items: [],
                };
            }

            const data = res as PromptVariationItem[];

            return {
                i18nTitle: "PreviewTitle_Generated",
                items: data.map((item) => ({
                    id: item.prompt,
                    type: SlashCommandPreviewItemType.TEXT,
                    value: item.prompt,
                })),
            };
        } catch (err) {
            this.app.getLogger().error("GenGifCommand.previewer", err);
            sendMessageToSelf(
                modify,
                context.getRoom(),
                context.getSender(),
                context.getThreadId()!,
                `${ErrorMessages.PROMPT_VARIATION_FAILED}`
            );
            return {
                i18nTitle: "",
                items: [],
            };
        }
    }
}
