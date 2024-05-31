import {
    ApiEndpoint,
    IApiEndpointInfo,
    IApiRequest,
    IApiResponse,
} from "@rocket.chat/apps-engine/definition/api";
import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";

export class UpdateEndpoint extends ApiEndpoint {
    path = "gif-res";
    
    public async post(
        request: IApiRequest,
        endpoint: IApiEndpointInfo,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence
    ): Promise<IApiResponse> {
        this.app.getLogger().log("GifEndpoint.post", request.content);
        console.log("GifEndpoint.post", request.content);
        // TODO: Implement the endpoint to handle the gif generation updates

        return {
            status: 200,
            content: {
                message: "NOT Implemented",
            },
        };
    }
}
