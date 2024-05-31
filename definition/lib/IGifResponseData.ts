export enum PredictionStatus {
    Starting = "starting",
    Processing = "processing",
    Succeeded = "succeeded",
    Failed = "failed",
    Canceled = "canceled"
}

export interface IGifResponseData {
    id: string  ;
    status: PredictionStatus  ;
    error: any;
}

