export interface IGifRequestBody {
    version: string;
    webhook: string;
    input: {
        mp4: boolean;
        steps: number;
        width: number;
        height: number;
        prompt: string;
        negative_prompt: string;
    };
}
