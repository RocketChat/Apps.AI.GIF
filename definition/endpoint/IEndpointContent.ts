export interface IUpdateEndpointContent {
    id: string;
    output: string;
    input: {
        prompt: string;
        negative_prompt: string;
    };
}
