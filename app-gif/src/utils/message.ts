import {
    IHttp,
    ILogger,
    IModify,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { getOrCreateDirectRoom } from "../helper/getOrCreateDirectRoom";
import { ErrorMessages, FirstTimeInstallMessages } from "../enum/messages";

// Utilizes a bot to notify user of any updates
export function sendMessageVisibleToSelf(
    modify: IModify,
    room: IRoom,
    user: IUser,
    bot: IUser,
    threadId: string | undefined,
    text: string
) {
    const message = modify.getCreator().startMessage({
        room,
        sender: bot,
        threadId,
        text,
        groupable: false,
    });

    modify.getNotifier().notifyUser(user, message.getMessage());
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
        const botUser: IUser = (await this.read
            .getUserReader()
            .getAppUser()) as IUser;

        sendMessageVisibleToSelf(
            modify,
            room,
            user,
            botUser,
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

export async function sendHelperMessageOnInstall(
    appId: string,
    user: IUser,
    read: IRead,
    modify: IModify
) {
    const appUser = (await read.getUserReader().getAppUser()) as IUser;
    const members = [user.username, appUser.username];

    const room = await getOrCreateDirectRoom(read, modify, members);

    const textMessageBuilder = modify
        .getCreator()
        .startMessage()
        .setRoom(room)
        .setSender(appUser)
        .setGroupable(true)
        .setParseUrls(false)
        .setText(FirstTimeInstallMessages.WELCOME_MESSAGE);

    await modify.getCreator().finish(textMessageBuilder);
}
