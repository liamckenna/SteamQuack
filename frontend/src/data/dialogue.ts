export interface DialogueVariant {
    lines: string[];
    next?: string;
    face?: "normal" | "happy" | "shocked" | "sad" | "closed";
    repeatable?: boolean;
}
const dialogues: Record<string, DialogueVariant[]> = {
    openingLine: [
        {
            lines: [
                "well come! **(click here or on the duck to continue)**",
            ],
            next: "remainingOpeningLines",
            face: "happy",
            repeatable: false,
        },
        {
            lines: [
                "howwwdy! **(click here or on the duck to continue)**",
            ],
            next: "remainingOpeningLines",
            face: "happy",
            repeatable: false,
        },
    ],
    remainingOpeningLines: [
        {
            lines: [
                "please, have a seet.",
                "my name is Ducktor Gamez. i herd your experiensing some simptoms of bordum.",
                "its truley unforchunate, but no need to worrey. yuve come to the rite plase.",
            ],
            next: "pleaseFillOutForm",
            face: "normal",
        },
        {
            lines: [
                "plees, make urself at home.",
                "my name is Ducktor Gamez. i herd your experiensing some simptoms of bordum.",
                "its truley unforchunate, but no need to worrey. yuve come to the rite plase.",
            ],
            next: "pleaseFillOutForm",
            face: "normal",
        },
    ],
    pleaseFillOutForm: [
        {
            lines: [
                "pleese fill out the form so i can evalue ate your case.",
            ],
            face: "happy",
        },
        {
            lines: [
                "pleese sign in at the front desk so i can evalue ate your case.",
            ],
            face: "happy",
        },
    ],
    steamURLInstruction: [
        {
            lines: [
                "go to ur steam profial, rite click on the page, and select 'copy page url'. then paste it in the form.",
            ],
            repeatable: false,
        }
    ],
    fetchingProfile: [
        {
            lines: [
                "let me chek my reckords.",
            ],
            face: "closed",
        },
        {
            lines: [
                "giv me a moment to chek my reckords.",
            ],
            face: "closed",
        },
    ],
    signInSuccess: [
        {
            lines: [
                "oh, there you r, hello [username]!",
            ],
            face: "happy",
            next: "signInSuccess2",
            repeatable: false,
        },
    ],
    signInSuccess2: [
        {
            lines: [
                "follow me to the egsam room so we can look at youre charts.",
            ],
            face: "normal",
        },
        {
            lines: [
                "come with me to the other room so we can e value ate youre charts.",
            ],
            face: "happy",
        },
    ],
    signInPrivate: [
        {
            lines: [
                "i found ur profial, but its set to private.",
                "i cant giv you a proper diag nosis without access to youre play history.",
                "check the instrucshons in the link below to make youre profial and game details public, then try signing in again.",
            ],
            face: "shocked",
        }
    ],
    signInPrivatePlaytimes: [
        {
            lines: [
                "even tho your profial is public, your play times are hidden.",
                "turn off the check box that says \"Always keep my total playtime private\" in your Steam privacy settings.",
            ],
            face: "shocked",
        }
    ],
    signInFailure: [
        {
            lines: [
                "i looked hi and low, but i couldnt find your profial.",
                "pleese check youre steam url and try again.",
            ],
            face: "sad",
        },
        {
            lines: [
                "im terriblee sorrey, but i couldnt find your steam profile in our sistem.",
                "pleese check youre steam url and try again.",
            ],
            face: "sad",
        },
    ],
    signOutSuccess: [
        {
            lines: [
                "hav some one else that needs a diag noses? try there profial.",
            ],
        },
        {
            lines: [
                "come again!",
            ],
            face: "happy",
        }
    ],
    openDiagnostics: [
        {
            lines: [
                "i ran sum tests, lets take a look at youre vitalz.",
            ],
            repeatable: false,
        }
    ],
    openPreferences: [
        {
            lines: [
                "let me heer moar about wat your looking fore.",
                "youre preferenses will asist me in my diag nosis and perscripshon.",
            ],
            repeatable: false,
        }
    ],
    priceRange: [
        {
            lines: [
                "do u perfer free games? trippple a games? or may be some thing in between?",
            ],
            repeatable: false,
        }
    ],
    reviewRange: [
        {
            lines: [
                "of coarse we alredy consider review scores as part of our diag nosis, how ever...",
                "il let you desid how \"good\" you want youre games too be.",
            ],
            repeatable: false,
        }
    ],
    releaseYearRange: [
        {
            lines: [
                "even tho steam lonched back in 2003, it still hostes gamez from all eras.",
            ],
            repeatable: false,
        }
    ],
    reviewCountRange: [
        {
            lines: [
                "review countz are a good in dickator of a gamez popularity...",
            ],
            repeatable: false,
            next: "reviewCountRange2",
        }
    ],
    reviewCountRange2: [
        {
            lines: [
                " turning it down may reveel sum hiden gems!",
            ],
            face: "closed",
        }
    ],
    randomizationFactor: [
        {
            lines: [
                "do ur recomendashons feel too samey? crank this alll the way up!",
            ],
            repeatable: false,
        }
    ],
    prioritizeSale: [
        {
            lines: [
                "i can make shure to giv u the best deels, if u want.",
            ],
            repeatable: false,
        }
    ],
    prioritizeRecentPlaytime: [
        {
            lines: [
                "i all ready giv considerashun to youre recent activity, but i can defin it lee pry or it ties it.",
            ],
            repeatable: false,
        }
    ],
    prioritizeTagsSearch: [
        {
            lines: [
                "if ur looking for a perticular typ of game, i can in creese its wait in my considurashins.",
            ],
            repeatable: false,
        }
    ],
    excludeTagsSearch: [
        {
            lines: [
                "let me no if you absolut lee do not want a sertain typ of game.",
            ],
            repeatable: false,
        }
    ],
    prioritizeGamesSearch: [
        {
            lines: [
                "tell me any gamez in your library that you particular lee want more of.",
            ],
            repeatable: false,
        }
    ],
    excludeGamesSearch: [
        {
            lines: [
                "ar there any gamez in your library that you dont want me to consider for recomendashons?",
                "sinse we use playtime as a factor in our diag nosis, sum times gamez uve played a lot can domin ate the results.",
                "if u think thats the case, try excluding those gamez from considerashon.",
            ],
            repeatable: true,
        }
    ],
    openPrescription: [
        {
            lines: [
                "giv me a moment to determin youre treat ment plan...",
            ],
        },
        {
            lines: [
                "let me re view my notez...",
            ],
        }
    ],
    generalPrescription: [
        {
            lines: [
                "after looking at your chartz, i hav come too the conclushun that you are in need of a new game!",
                "hear are sum i think you mite injoy.",
                "click them onse for mor detales, click twise to go to the store page!",
            ],
        },
        {
            lines: [
                "it seems that you are in need of a new game!",
                "hear are a few i hav in mind for you.",
                "click them onse for mor detales, click twise to go to the store page!",
            ],
            face: "closed",
        }
    ],
    noResults: [
        {
            lines: [
                "hmm, i couldnt find any gamez that match youre preferenses.",
                "try adjusting youre filters and ill take a nuther look.",
            ],
            face: "sad",
        },
        {
            lines: [
                "hmm, im strugle ing to find sumthing that meets youre preferenses.",
                "try adjusting youre filters and ill take a nuther look.",
            ],
            face: "shocked",
        }
    ],
    readGameDescription: [
        {
            lines: [
                "**[GameName]**: \"[GameDescription]\"",
                "it has a **[ReviewScore]%** from **[ReviewCount]** steam reviews and was released on **[ReleaseDate]**.",
            ],
            face: "normal",
            next: "readGamePrice",
        }
    ],
    readGameDescriptionHighReviewScore: [
        {
            lines: [
                "**[GameName]**: \"[GameDescription]\"",
            ],
            face: "normal",
            next: "readGameDescriptionHighReviewScore2",
        }
    ],
    readGameDescriptionHighReviewScore2: [
        {
            lines: [
                "it scored an impressive **[ReviewScore]%** from **[ReviewCount]** steam reviews and was released on **[ReleaseDate]**.",
            ],
            face: "happy",
            next: "readGamePrice",
        }
    ],
    readGameDescriptionLowReviewScore: [
        {
            lines: [
                "**[GameName]**: \"[GameDescription]\"",
            ],
            face: "normal",
            next: "readGameDescriptionLowReviewScore2",
        }
    ],
    readGameDescriptionLowReviewScore2: [
        {
            lines: [
                "oh... it scored a flattering **[ReviewScore]%** from **[ReviewCount]** steam reviews.",
                "have fun with that one i guess.",
            ],
            face: "shocked",
            next: "readGamePrice",
        }
    ],
    readGamePrice: [
        {
            lines: [
                "current lee, you can purchase [GameName] for **[Price]**.",
            ],
            face: "normal",
        }
    ],
    readGameDescriptionSale: [
        {
            lines: [
                "**[GameName]**: \"[GameDescription]\"",
                "it has a **[ReviewScore]%** from **[ReviewCount]** steam reviews and was released on **[ReleaseDate]**.",
                "its currently on sale for **[Price]**, a **[Discount]%** dis count!",
            ],
            face: "normal",
        }
    ],
};

export default dialogues;