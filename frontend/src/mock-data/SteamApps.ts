export interface SteamApp {
    appid: number;
    initial_price: number;
    current_price: number;
    name: string;
    desc: string;
    release_date: string;
    release_date_unix: number;
    review_count: number;
    review_desc: string;
    review_percentage: number;
    review_sample: string;
}

export interface SteamApps {
    app_count: number;
    apps: Record<string, SteamApp>;
}