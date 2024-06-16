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
import { InfoMessages } from "../enum/InfoMessages";
import { GifRequestDispatcher } from "../lib/GifRequestDispatcher";
import { OnGoingGenPersistence } from "../persistence/OnGoingGenPersistence";
import { PromptVariationItem, RedefinedPrompt } from "../lib/RedefinePrompt";

export class GenGifCommand implements ISlashCommand {
    public command = "gen-gif";
    public i18nParamsExample = "GenGIFCommandExample";
    public i18nDescription = "GenGIFCommandDescription";
    public providesPreview = true;

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

    debounce(func: (...args: any[]) => Promise<any>, delay: number) {
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

            return new Promise<any>((resolve, reject) => {
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

    debouncedGetRequest: (
        args: string,
        http: IHttp,
        context: SlashCommandContext
    ) => any = this.debounce(
        async (args: string, http: IHttp, context: SlashCommandContext) => {
            const redefinePrompt = new RedefinedPrompt();

            const data = await redefinePrompt.requestPromptVariation(
                args,
                http,
                context.getSender().id,
                this.app.getLogger()
            );

            return data;
        },
        2000
    );

    async previewer(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence
    ): Promise<ISlashCommandPreview> {
        let args = context.getArguments()[0].trim();

        const res = await this.debouncedGetRequest(args, http, context);

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
    }
}
