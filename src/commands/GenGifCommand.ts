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
import { Preferences } from "../enum/Preferences";
import { getSettingFromId } from "../utils/prefs";
import { InfoMessages } from "../enum/InfoMessages";

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
        const apiKey = await getSettingFromId(read, Preferences.API_KEY);
        if (!apiKey) {
            this.app.getLogger().log("API Key not set");
            return sendMessageToSelf(
                modify,
                context.getRoom(),
                context.getSender(),
                context.getThreadId()!,
                InfoMessages.API_KEY_NOT_SET
            );
        }

        const webhookUrl = await getSettingFromId(
            read,
            Preferences.WEBHOOK_URL
        );
        if (!webhookUrl) {
            this.app.getLogger().log("Webhook URL not set");
            return sendMessageToSelf(
                modify,
                context.getRoom(),
                context.getSender(),
                context.getThreadId()!,
                InfoMessages.WEBHOOK_URL_NOT_SET
            );
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

        //  messageId is required as we need to later update the message with the GIF
        // sending the message to everyone in the room so that the GIF doesn't show up abruptly to users
        const awaitMessageId = sendMessageToRoom(
            modify,
            context.getRoom(),
            context.getSender(),
            context.getThreadId()!,
            `Your GIF is being generated.\nPrompt: ${prompt}`,
            ":hourglass_flowing_sand:"
        );

        // TODO 1: Make HTTP request to the API(replicate) to generate the GIF
    }
}
