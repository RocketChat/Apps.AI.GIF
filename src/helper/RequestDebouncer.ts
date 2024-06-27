import { IHttp, ILogger } from "@rocket.chat/apps-engine/definition/accessors";
import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import { PromptVariationItem, RedefinedPrompt } from "../lib/RedefinePrompt";

export class RequestDebouncer {
    // generic function to debounce multiple requests to the same function, ensures that only the last request is executed
    private debounce<T>(
        func: (...args: any[]) => Promise<T>,
        delay: number
    ): () => Promise<T> {
        let debounceTimer: NodeJS.Timeout | null = null;

        // store to resolve the current promise as undefined, if a new request is received
        let resolveCurrent: ((value?: any) => void) | null = null;

        return function (...args: any[]) {
            if (debounceTimer) {
                clearTimeout(debounceTimer);
                if (resolveCurrent) {
                    // received a new request, resolve the current promise as undefined
                    resolveCurrent(undefined);
                }
            }

            return new Promise<T>((resolve, reject) => {
                resolveCurrent = resolve;
                debounceTimer = setTimeout(async () => {
                    try {
                        const result = await func(...args);
                        resolve(result);
                    } catch (error) {
                        reject(error);
                    } finally {
                        debounceTimer = null;
                        resolveCurrent = null;
                    }
                }, delay);
            });
        };
    }

    /**
     * This function is a debounced version of the `requestPromptVariation` method.
     * It may throw an error if the request fails or any error occurs.
     *
     * @param args - The arguments for the request.
     * @param http - The HTTP utility to make requests.
     * @param logger - Logger for logging information.
     * @param context - The context of the slash command.
     * @returns {PromptVariationItem[]} The list of prompt variations.
     * @throws {Error} When the request or processing fails.
     */
    debouncedGetRequest: (
        args: string,
        http: IHttp,
        logger: ILogger,
        context: SlashCommandContext
    ) => Promise<PromptVariationItem[]> = this.debounce(
        async (
            args: string,
            http: IHttp,
            logger: ILogger,
            context: SlashCommandContext
        ) => {
            const redefinePrompt = new RedefinedPrompt();

            const data = await redefinePrompt.requestPromptVariation(
                args,
                http,
                context.getSender().id,
                logger
            );

            return data;
        },
        2000
    );
}
