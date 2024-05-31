import { IRead } from "@rocket.chat/apps-engine/definition/accessors";

export async function getSettingFromId(
    read: IRead,
    id: string
): Promise<string | undefined> {
    const settingValue = await read
        .getEnvironmentReader()
        .getSettings()
        .getValueById(id);

    if (!settingValue || settingValue === "") {
        return undefined;
    }

    return settingValue;
}
