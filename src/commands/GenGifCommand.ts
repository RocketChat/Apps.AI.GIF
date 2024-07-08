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
} from "@rocket.chat/apps-engine/definition/slashcommands";
import { AiGifApp } from "../../AiGifApp";
import { RequestDebouncer } from "../helper/RequestDebouncer";
import { GenerationPersistence } from "../persistence/GenerationPersistence";
import { CommandUtility } from "./CommandUtility";

export class GenGifCommand implements ISlashCommand {
    public command = "gen-gif";
    public i18nParamsExample = "GenGIFCommandExample";
    public i18nDescription = "GenGIFCommandDescription";
    public providesPreview = true;

    private requestDebouncer = new RequestDebouncer();

    constructor(private readonly app: AiGifApp) {}

    async previewer(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence
    ): Promise<ISlashCommandPreview> {
        const commandUtility = new CommandUtility({
            app: this.app,
            params: context.getArguments(),
            sender: context.getSender(),
            room: context.getRoom(),
            read,
            modify,
            http,
            persis,
            triggerId: context.getTriggerId(),
            threadId: context.getThreadId(),
        });

        return await commandUtility.resolveCommand(this.requestDebouncer);
    }

    async executePreviewItem?(
        item: ISlashCommandPreviewItem,
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence
    ): Promise<void> {
        const commandUtility = new CommandUtility({
            app: this.app,
            params: context.getArguments(),
            sender: context.getSender(),
            room: context.getRoom(),
            read,
            modify,
            http,
            persis,
            triggerId: context.getTriggerId(),
            threadId: context.getThreadId(),
        });

        return await commandUtility.resolveExecutePreviewItem(item);
    }

    executor(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence
    ): Promise<void> {
        throw new Error("Method not implemented.");
    }
}
