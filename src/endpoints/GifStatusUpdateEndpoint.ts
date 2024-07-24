import {
    ApiEndpoint,
    IApiEndpointInfo,
    IApiRequest,
    IApiResponse,
} from "@rocket.chat/apps-engine/definition/api";
import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { OnGoingGenPersistence } from "../persistence/OnGoingGenPersistence";
import { IUpdateEndpointContent } from "../../definition/endpoint/IEndpointContent";
import {
    ActionsBlock,
    BlockElementType,
    ButtonElement,
    LayoutBlockType,
    SectionBlock,
    TextObjectType,
} from "@rocket.chat/ui-kit";
import { ButtonActionIds, ButtonBlockIds } from "../enum/Identifiers";
import { GenerationPersistence } from "../persistence/GenerationPersistence";

export class GifStatusUpdateEndpoint extends ApiEndpoint {
    path = "gif-status-update";

    public async post(
        request: IApiRequest,
        endpoint: IApiEndpointInfo,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence
    ): Promise<IApiResponse> {
        this.app
            .getLogger()
            .log("GifUpdateStatusEndpoint.post", request.content);

        const content = request.content as IUpdateEndpointContent;

        const onGoingGenPeristence = new OnGoingGenPersistence(
            persis,
            read.getPersistenceReader()
        );

        const record = await onGoingGenPeristence.getRecordById(content.id);

        if (!record) {
            this.app.getLogger().log("Record not found");
            return {
                status: 404,
                content: {
                    message: "Record not found",
                },
            };
        }

        const sender = await read.getUserReader().getById(record.uid);
        const room = await read.getRoomReader().getById(record.roomId);

        if (!sender || !room) {
            return {
                status: 404,
                content: {
                    text: "User or Room not found",
                },
            };
        }

        const sendToChatButton: ButtonElement = {
            type: BlockElementType.BUTTON,
            style: "primary",
            text: {
                type: TextObjectType.PLAIN_TEXT,
                text: "Send",
                emoji: false,
            },
            appId: this.app.getID(),
            blockId: ButtonBlockIds.REGENERATE_OPTIONS_BLOCK,
            actionId: ButtonActionIds.APPROVE,
            value: JSON.stringify({
                prompt: record.prompt,
                url: content.output,
            }),
        };
        const regenerateButton: ButtonElement = {
            type: BlockElementType.BUTTON,
            text: {
                type: TextObjectType.PLAIN_TEXT,
                text: "Regenerate",
                emoji: false,
            },
            appId: this.app.getID(),
            blockId: ButtonBlockIds.REGENERATE_OPTIONS_BLOCK,
            actionId: ButtonActionIds.REGENERATE,
            value: JSON.stringify({
                prompt: record.prompt,
                url: content.output,
            }),
        };

        const buttonElement: ActionsBlock = {
            type: LayoutBlockType.ACTIONS,
            elements: [sendToChatButton, regenerateButton],
        };
        const section: SectionBlock = {
            type: LayoutBlockType.SECTION,
            text: {
                type: TextObjectType.PLAIN_TEXT,
                text: "Your generation has completed successfully! If you are satisfied with the generation approve it, else feel free to regenerate with a better prompt.",
            },
        };

        const message = modify
            .getCreator()
            .startMessage()
            .setRoom(room)
            .setSender(sender)
            .setText(record.prompt)
            .setAttachments([
                {
                    title: { value: record.prompt },
                    imageUrl: content.output,
                },
            ])
            .setBlocks([section, buttonElement]);

        await modify.getNotifier().notifyUser(sender, message.getMessage());

        // delete record from generation persistence
        await onGoingGenPeristence.deleteRecordById(content.id);

        const generationPersistence = new GenerationPersistence(
            record.uid,
            persis,
            read.getPersistenceReader()
        );

        await generationPersistence.add({
            query: record.prompt,
            url: content.output,
        });

        return {
            status: 200,
            content: {
                message: "Gif updated",
                ...request.content,
            },
        };
    }
}
