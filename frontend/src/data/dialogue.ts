export interface DialogueVariant {
    lines: string[];
    next?: string;
}
const dialogues: Record<string, DialogueVariant[]> = {
    openingLine: [
        {
            lines: [
                "well come! (click here to continue)",
            ],
            next: "remainingOpeningLines",
        },
        {
            lines: [
                "howwwdy! (click here to continue)",
            ],
            next: "remainingOpeningLines",
        },
    ],
    remainingOpeningLines: [
        {
            lines: [
                "please, have a seet.",
                "my name is Ducktor Gamez. i herd your experiensing some simptoms of bordum.",
                "its truley unforchunate, but no need to worrey. yuve come to the rite plase.",
                "pleese fill out the new pashient form so i can evalue ate your case.",
            ],
        },
    ],
    signInSuccess: [
        {
            lines: [
                "Nice, you're signed in!",
                "Let me take a look at your games...",
                "Ready to find your next favorite?",
            ]
        }
    ],
    signInPrivate: [
        {
            lines: [
                "I found your account, but it looks like your game details are private.",
                "Please set your game details to public on Steam and try signing in again.",
            ]
        }
    ],
    signInPrivatePlaytimes: [
        {
            lines: [
                "I found your account, but it looks like your playtime details are private.",
                "Please set your playtime details to public on Steam and try signing in again.",
            ]
        }
    ],
    signInFailure: [
        {
            lines: [
                "Hmm, I couldn't find your Steam account.",
                "Please make sure you've entered your Steam ID correctly and try again.",
            ]
        }
    ],
    noResults: [
        {
            lines: [
                "Hmm, I couldn't find any games matching that...",
                "Try adjusting your filters!",
            ]
        }
    ],
    generalPrescription: [
        {
            lines: [
                "after looking at your charts, i hav come too the conclushun that you are in need of a new game!",
                "hear are sum i think you mite injoy.",
            ]
        }
    ],
    generalPreferences: [
        {
            lines: [
                "let me heer moar about wat your looking fore.",
                "youse this paige to set your prefrenses, and ill use them to assist me in my diagnosis and prescription.",
            ]
        }
    ]
};

export default dialogues;