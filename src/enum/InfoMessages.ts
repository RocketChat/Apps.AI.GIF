export enum InfoMessages {
    API_KEY_NOT_SET = "You didn't set the API Key, please set it to generate gifs.",
    API_URL_NOT_SET = "You didn't set the API URL, please set it to generate gifs.",
    WEBHOOK_URL_NOT_SET = "You didn't set the Webhook URL, please set it to generate gifs.",
    NO_QUERY_FOUND = "You didn't provide a valid prompt to generate a gif.",
    MODEL_ID_NOT_SET = "You didn't set the Model ID, please set it to generate gifs.",
    GENERATION_IN_PROGRESS = "Generating the gif, please wait...",
    GENERATION_FAILED = "Failed to generate the gif, please try again later.",
    PROFANITY_FOUND_MESSAGE = "The text contains profanity. Please provide a different text. \nDetected Words:",
    NO_ITEMS_FOUND_ON_PAGE= "No items to show on page: ",
}

export enum ErrorMessages {
    PROMPT_VARIATION_FAILED = "Server Error: Failed to get prompt variations, please try again later.",
}
