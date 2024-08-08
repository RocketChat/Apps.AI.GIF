export enum InfoMessages {
    API_KEY_NOT_SET = "You didn't set the API Key, please set it to generate gifs.",
    API_URL_NOT_SET = "You didn't set the API URL, please set it to generate gifs.",
    WEBHOOK_URL_NOT_SET = "You didn't set the Webhook URL, please set it to generate gifs.",
    NO_QUERY_FOUND = "You didn't provide a valid prompt to generate a gif.",
    MODEL_ID_NOT_SET = "You didn't set the Model ID, please set it to generate gifs.",
    GENERATION_IN_PROGRESS = "Generating the gif, please wait...",
    GENERATION_FAILED = "Failed to generate the gif, please try again later.",
    PROFANITY_FOUND_MESSAGE = "The text contains profanity. Please provide a different text. \nDetected Words:",
    NO_ITEMS_FOUND = "No items found. Please generate a GIF first.",
    PAGE_OUT_OF_BOUNDS = "The provided page number is out of range. The last page number is ",
}

export enum ErrorMessages {
    PROMPT_VARIATION_FAILED = "Server Error: Failed to get prompt variations, please try again later.",
    INVALID_PAGE_NUMBER = "The provided page number is invalid, please provide a valid page number.",
    GIF_UPLOAD_FAILED = "An error occcurred while uploading the GIF to channel",
}

export enum HelperMessages {
    HELPER_COMMANDS = `• use \`/gen-gif p <yourprompthere>\` to generate GIF using your own prompt.
        • use \`/gen-gif q <yourqueryhere>\` to get a list of suggested prompts and use them to generate a GIF.
        • use \`/gen-gif history <page_number>\` to view past generations.
        `,
    HELPER_TEXT = `Need some help with \`/gen-gif\`?\n`,
}

export enum FirstTimeInstallMessages {
    WELCOME_MESSAGE = `#### Ready to unleash your creativity with GIFs in Rocket.Chat? 
This all-new AI GIF generator app lets you:

- **Generate GIFs on the fly**: No more endless searches! Just provide a descriptive prompt within your Rocket.Chat channel and watch your GIF come to life.
- **Never lose track of your masterpieces**: Easily browse past generations with a convenient history preview. 
- **AI-powered inspiration**: Get a spark for your next GIF with NLP-powered prompt suggestions. Let the AI help you brainstorm!
- **Keep it professional**: Enjoy built-in NSFW content filtering for a safe and appropriate environment. 
- **Need a hand?** No problem! Simply type \`gen-gif help\` for quick and easy instructions.
- **Don't settle for the first try**:  Regenerate your GIF with ease if the initial result isn't quite what you envisioned.

#### Ready to get started?
1. **Set up your API key**: To generate GIFs, you need to set up your API key. Simply visit Replicate to generate one.
2. **Set up your Webhook URL**: To generate GIFs, you need to set up your Webhook URL. Go to app preferences and you will find the Webhook URL under the APIs section. Copy it and paste in the settings section. 

That's all, **Let the fun begin!**`,
}
