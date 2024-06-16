export enum PredictionStatus {
    STARTING = "starting",
    PROCESSING = "processing",
    SUCCEEDED = "succeeded",
    FAILED = "failed",
    CANCELLED = "canceled" // Intentional typo to match the API response
}

export interface IGifResponseData {
    id: string;
    status: PredictionStatus;
    error: any;
}
