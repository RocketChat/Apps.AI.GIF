import { IHttp, ILogger } from "@rocket.chat/apps-engine/definition/accessors";
import { prompt } from "../enum/SystemPrompt";

export interface PromptVariationItem {
    prompt: string;
    length: number;
}

export class RedefinedPrompt {
    async mockRequestPromptVariation(
        query: string,
    ): Promise<PromptVariationItem[]> {
        const length = query.length + 2;
        let data: PromptVariationItem[] = [];

        for (let i = 1; i <= 10; i++) {
            data.push({ prompt: `${query} ${i}`, length: length });
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));

        return data;
    }

    async requestPromptVariation(
        query: string,
        http: IHttp,
        senderId: string,
        logger: ILogger
    ): Promise<PromptVariationItem[]> {
        const headers = {
            "Content-Type": "application/json",
        };

        const model = "mistral";
        const url = "http://mistral-7b/v1";

        const payload = {
            messages: [
                {
                    role: "user",
                    content: `${prompt}\n${query}`,
                    user: senderId,
                },
            ],
            model,
        };

        try {
            const response = await http.post(url + "/chat/completions", {
                headers,
                data: payload,
            });

            const data = response.data.choices[0].message.content;
            const list: PromptVariationItem[] = JSON.parse(data);

            return list;
        } catch (e) {
            logger.error("PromptVariationCommand.preview", e);
            return [];
        }
    }
}
