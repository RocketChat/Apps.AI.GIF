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
import { IUpdateEndpointContent } from "../../definition/endpoints/IEndpointContent";

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

        const mes = await read
            .getMessageReader()
            .getById(record.awaitMessageId);

        if (!mes) {
            return {
                status: 404,
                content: {
                    text: "Message not found",
                },
            };
        }
        modify.getUpdater().message(mes.id!, sender);
        const message = await modify.getUpdater().message(mes.id!, sender);
        message.setText("Prompt: " + record.prompt).addAttachment({
            title: {
                value: record.prompt,
            },
            imageUrl: content.output,
        });
        message.setEditor(sender);

        await modify.getUpdater().finish(message);

        // await modify.getDeleter().deleteMessage(mes, sender);
        // const message = modify.getCreator().startMessage({
        //     room,
        //     sender,
        //     text: `Prompt: ${record.prompt}`,
        //     attachments: [
        //         {
        //             title: {
        //                 value: record.prompt,
        //             },
        //             imageUrl: content.output,
        //         },
        //     ],
        //     groupable: false,
        // });

        // await modify.getCreator().finish(message);

        // delete record from generation persistence
        await onGoingGenPeristence.deleteRecordById(content.id);

        return {
            status: 200,
            content: {
                message: "Gif updated",
            },
        };
    }
}
