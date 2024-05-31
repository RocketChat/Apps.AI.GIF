import {
    IPersistence,
    IPersistenceRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    RocketChatAssociationModel,
    RocketChatAssociationRecord,
} from "@rocket.chat/apps-engine/definition/metadata";

interface OnGoingGenRecord {
    generationId: string;
    prompt: string;
    roomId: string;
    threadId: string | undefined;
    uid: string;
}

interface OnGoingGenRecordWrapper {
    records: OnGoingGenRecord[];
}

export class OnGoingGenPersistence {
    private key = "ongoing-generation-record";

    constructor(
        readonly persistence: IPersistence,
        readonly persistenceRead: IPersistenceRead
    ) {}

    async getAll() {
        const res = await this.persistenceRead.readByAssociation(
            new RocketChatAssociationRecord(
                RocketChatAssociationModel.MISC,
                this.key
            )
        );
        return res;
    }

    async getAllItems(): Promise<OnGoingGenRecord[]> {
        const records = await this.getAll();
        if (records.length == 0) {
            return [];
        }
        return (records[0] as OnGoingGenRecordWrapper).records;
    }

    async getRecordById(id: string): Promise<OnGoingGenRecord | undefined> {
        const items = await this.getAllItems();

        const res = items.filter((item) => item.generationId === id);

        if (res.length == 0) {
            return undefined;
        }
        return res[0];
    }

    async deleteRecordById(id: string): Promise<void> {
        const items = await this.getAllItems();
        const res = items.filter((item) => item.generationId !== id);

        await this.persistence.updateByAssociation(
            new RocketChatAssociationRecord(
                RocketChatAssociationModel.MISC,
                this.key
            ),
            {
                records: res,
            }
        );
    }

    async add(record: OnGoingGenRecord): Promise<void> {
        const records = await this.getAll();

        if (!records || records.length == 0) {
            await this.persistence.createWithAssociation(
                {
                    records: [record],
                },
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.MISC,
                    this.key
                )
            );
        } else {
            await this.persistence.updateByAssociation(
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.MISC,
                    this.key
                ),
                {
                    records: [
                        record,
                        ...(records[0] as OnGoingGenRecordWrapper).records,
                    ],
                }
            );
        }
    }
}
