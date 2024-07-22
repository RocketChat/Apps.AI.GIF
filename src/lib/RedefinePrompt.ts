import {
    HttpStatusCode,
    IHttp,
    ILogger,
} from "@rocket.chat/apps-engine/definition/accessors";
import { profanitySeedPrompt, variationSeedPrompt } from "../enum/SystemPrompt";

export interface PromptVariationItem {
    prompt: string;
    length: number;
}

export class RedefinedPrompt {
    private headers = {
        "Content-Type": "application/json",
    };

    private model = "mistral";
    private url = "http://mistral-7b/v1";

    async mockRequestPromptVariation(
        query: string
    ): Promise<PromptVariationItem[]> {
        const length = query.length + 2;
        let data: PromptVariationItem[] = [];

        for (let i = 1; i <= 4; i++) {
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
        const payload = {
            messages: [
                {
                    role: "user",
                    content: `${variationSeedPrompt}\n${query}`,
                    user: senderId,
                },
            ],
            model: this.model,
        };

        try {
            const response = await http.post(this.url + "/chat/completions", {
                headers: this.headers,
                data: payload,
            });

            if (!response || response.statusCode !== HttpStatusCode.OK) {
                throw new Error("Failed to get response from model");
            }

            const data = response.data.choices[0].message.content;
            const list: PromptVariationItem[] = JSON.parse(data);

            return list;
        } catch (e) {
            logger.error("PromptVariationCommand.preview", e);
            return [];
        }
    }

    async performProfanityCheck(
        prompt: string,
        senderId: string,
        http: IHttp,
        logger: ILogger
    ): Promise<IProfanityCheckResponse | undefined> {
        const payload = {
            messages: [
                {
                    role: "user",
                    content: `${profanitySeedPrompt} ${prompt}`,
                    user: senderId,
                },
            ],
            model: this.model,
        };

        try {
            const response = await http.post(this.url + "/chat/completions", {
                headers: this.headers,
                data: payload,
            });

            const data = response.data.choices[0].message.content;
            const res: IProfanityCheckResponse = JSON.parse(data);

            return res;
        } catch (e) {
            logger.error("PromptVariationCommand.preview", e);
            return undefined;
        }
    }
}

interface IProfanityCheckResponse {
    string: string;
    containsProfanity: boolean;
    profaneWords: string[];
}
