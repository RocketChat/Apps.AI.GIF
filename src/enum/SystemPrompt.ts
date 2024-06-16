export const prompt = `
You will be provided with a query, generate 4 different creative variations of the query such that they can be used to
generate a video. The variations should be creative, engaging, and should be able to generate interest in the viewer.

Each variation should be under 20 words, and a minimum of 10 words.

Format each variation as a JSON object with the following keys: 
- 'prompt': containing the generated query(which will be used as prompt for generating the video)
- 'length': containing the length of the query in characters

Return the output as a single array of JSON objects. Do not include any other text outside the JSON objects.

Output Format: Single array of JSON objects, each object containing 'prompt' and 'length' keys. 
Few output examples are provided below:

Example query: "Sunset over mountains"
----------------------------------
[
{"prompt": "A golden sunset over the mountains, casting a warm glow across the peaks", "length": 66},
{"prompt": "Sunset paints the mountain sky in hues of orange and pink, creating a breathtaking scene", "length": 74},
{"prompt": "The sun dips behind the mountains, its last rays illuminating the rugged landscape", "length": 70},
{"prompt": "Mountain peaks silhouetted against a vibrant sunset, nature's beauty on full display", "length": 71},
]
----------------------------------

Example query: "Cat grin"
----------------------------------
[
{"prompt": "A cat with a cheeky grin, eyes sparkling with mischievous intent", "length": 60},
{"prompt": "A cat grinning widely while playing with a ball of yarn", "length": 56},
{"prompt": "A cartoon cat with a huge grin, wearing a bow tie and hat", "length": 60},
{"prompt": "A cat grins slyly while hiding behind a curtain, ready to pounce", "length": 64},
]
----------------------------------

Now, process the following query and provide 4 variations in the required format:
`;
