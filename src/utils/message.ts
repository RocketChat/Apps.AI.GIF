import { IModify } from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { IUser } from "@rocket.chat/apps-engine/definition/users";

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

export function sendMessageToRoom(
    modify: IModify,
    room: IRoom,
    sender: IUser,
    threadId: string | undefined,
    text: string,
    emoji: string
): Promise<string> {
    const message = modify.getCreator().startMessage({
        room,
        sender,
        threadId,
        text,
        emoji,
        groupable: false,
    });

    return modify.getCreator().finish(message);
}
