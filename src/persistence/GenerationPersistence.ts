import {
    IPersistence,
    IPersistenceRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    RocketChatAssociationModel,
    RocketChatAssociationRecord,
} from "@rocket.chat/apps-engine/definition/metadata";

interface GenerationRecord {
    id: string,
    query: string;
    url: string;
}

interface GenerationRecordWrapper {
    generated_gifs: GenerationRecord[];
}

export class GenerationPersistence {
    private key = "gen-gif";
    private associations: RocketChatAssociationRecord[];

    constructor(
        readonly userId: string,
        readonly persistence: IPersistence,
        readonly persistenceRead: IPersistenceRead
    ) {
        this.associations = [
            new RocketChatAssociationRecord(
                RocketChatAssociationModel.MISC,
                this.key
            ),
            new RocketChatAssociationRecord(
                RocketChatAssociationModel.USER,
                this.userId
            ),
        ];
    }

    async getAll() {
        const res = await this.persistenceRead.readByAssociations(
            this.associations
        );
        return res;
    }

    async getAllItems(): Promise<GenerationRecord[]> {
        const records = await this.getAll();
        if (records.length == 0) {
            return [];
        }
        return (records[0] as GenerationRecordWrapper).generated_gifs;
    }

    async getItemsForPage(page: number) {
        const itemsPerPage = 10;
        const records = await this.getAllItems();

        const start = page * itemsPerPage;
        const end = start + itemsPerPage;

        const list = records.slice(start, end);
        console.log(page, list.length, list);

        return list;
    }

    async add(record: GenerationRecord): Promise<void> {
        const records = await this.getAll();

        if (!records || records.length == 0) {
            await this.persistence.createWithAssociations(
                {
                    generated_gifs: [record],
                },
                this.associations
            );
        } else {
            await this.persistence.updateByAssociations(this.associations, {
                generated_gifs: [
                    record,
                    ...(records[0] as GenerationRecordWrapper).generated_gifs,
                ],
            });
        }
    }
}
