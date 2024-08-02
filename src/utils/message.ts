import {
    IHttp,
    ILogger,
    IModify,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { ErrorMessages } from "../enum/InfoMessages";

export function sendMessageToSelf(
    modify: IModify,
    room: IRoom,
    sender: IUser,
    threadId: string | undefined,
    text: string,
    emoji?: string
) {
    const message = modify.getCreator().startMessage({
        room,
        sender,
        threadId,
        text,
        emoji,
        groupable: false,
    });

    modify.getNotifier().notifyUser(sender, message.getMessage());
}

export async function uploadGifToRoom(
    url: string,
    prompt: string,
    http: IHttp,
    modify: IModify,
    room: IRoom,
    user: IUser,
    logger: ILogger,
    threadId?: string | undefined
): Promise<string | undefined> {
    try {
        const res = await http.get(url, {
            encoding: null,
        });

        if (res && res.content) {
            const buffer = Buffer.from(res.content);
            const fileName: string = prompt.split(" ").join("-");
            const upload = await modify
                .getCreator()
                .getUploadCreator()
                .uploadBuffer(buffer, {
                    filename: `${fileName}.gif`,
                    room,
                    user: user,
                });

            return upload.url;
        }
        throw new Error("Failed to fetch GIF while uploading GIFf");
    } catch (e) {
        logger.error(ErrorMessages.GIF_UPLOAD_FAILED, e);
        sendMessageToSelf(
            modify,
            room,
            user,
            threadId,
            ErrorMessages.GIF_UPLOAD_FAILED
        );
        return undefined;
    }
}

export async function sendGifToRoom(
    url: string,
    prompt: string,
    modify: IModify,
    room: IRoom,
    user: IUser
) {
    const messageBuilder = modify
        .getCreator()
        .startMessage()
        .setGroupable(false)
        .setRoom(room)
        .setSender(user)
        .setAttachments([
            {
                title: { value: prompt },
                imageUrl: url,
            },
        ]);

    await modify.getCreator().finish(messageBuilder);
}
