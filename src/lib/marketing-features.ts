
export type MarketingFeature = {
    key: string;
    defaultText: string;
}

export type FeatureGroup = {
    groupName: string;
    features: MarketingFeature[];
}

export const MARKETING_FEATURES: FeatureGroup[] = [
    {
        groupName: "Shop-Level Boosts",
        features: [
            { key: "shop:priority_search", defaultText: "Priority Search Ranking: Appear before standard sellers in manufacturer searches." },
            { key: "shop:premium_badge", defaultText: "Premium Verified Badge: A distinctive gradient checkmark next to your shop name everywhere." },
            { key: "shop:enhanced_profile", defaultText: "Enhanced Shop Profile: A subtle, animated gradient border around your shop's logo and banner." },
            { key: "shop:homepage_feature", defaultText: "Homepage 'Featured Manufacturer' Slot: Your shop is entered into a high-priority rotation on the homepage's 'Featured Manufacturers' section." },
            { key: "shop:category_spotlight", defaultText: "Homepage 'Category Spotlight' Takeover: Be the sole featured manufacturer in a weekly homepage spotlight for your industry (one week per month)." },
            { key: "shop:points_multiplier", defaultText: "Buyer Points Multiplier: Buyers earn 1.5x TradPoints on all purchases from your shop." },
            { key: "shop:partner_banner", defaultText: "'Official Partner' Banner: A special banner appears on all your product pages." },
            { key: "shop:permanent_homepage", defaultText: "Permanent Homepage Presence: Your shop has a permanent, static placement in the 'Featured Manufacturers' section." },
            { key: "shop:cross_promo", defaultText: "Cross-Promotional Placements: Recommended in a sidebar on related, non-competing product pages." },
            { key: "shop:custom_theme", defaultText: "Customizable Shop Profile Theme: Access to exclusive premium themes for your shop profile page." },
        ]
    },
    {
        groupName: "Product-Level Promotions",
        features: [
            { key: "product:homepage_rotation", defaultText: "Homepage Feature: Your product is added to the rotation for the 'Featured Products' section on the homepage." },
            { key: "product:category_top", defaultText: "Top of Category: Your product gets a sponsored slot at the top of its specific category page." },
            { key: "product:category_image", defaultText: "Category Image Takeover: Your product image becomes the main visual for its category." },
            { key: "product:search_priority", defaultText: "Priority Search Placement: Appear as a 'Sponsored' item at the top of relevant searches." },
            { key: "product:main_banner", defaultText: "Main Banner Feature: Your product is featured in the large sliding banner on the main /products page." },
            { key: "product:competitor_placement", defaultText: "Competitor Placement: Featured in 'You May Also Like' on direct competitor product pages." },
            { key: "product:newsletter_feature", defaultText: "Newsletter Feature: Your product is included in the weekly email newsletter to relevant buyers." },
            { key: "product:search_guarantee", defaultText: "Guaranteed #1 Search Placement: Your product is guaranteed the #1 organic and sponsored position in relevant searches." },
            { key: "product:order_confirmation_feature", defaultText: "Order Confirmation Feature: Your product is featured on the 'Order Confirmation' page after a user buys a related item." },
            { key: "product:permanent_carousel", defaultText: "Permanent Carousel Slot: Receive a dedicated, permanent slide in the /products page carousel that is always visible." },
            { key: "product:dedicated_analytics", defaultText: "Dedicated Analytics Dashboard: Access a dashboard showing performance of every ad placement for your product." },
        ]
    },
    {
        groupName: "External Advertising & PR",
        features: [
            { key: "external:google_ads", defaultText: "Google Ads Management: We manage a targeted Google Search campaign for your top products to drive external traffic." },
            { key: "external:social_ads", defaultText: "Social Media Ad Credit: Receive a monthly credit to be used for Facebook & Instagram advertising campaigns." },
            { key: "external:influencer_outreach", defaultText: "Managed Influencer Outreach: We connect you with 2 vetted Growth Partners per quarter for potential collaborations." },
            { key: "external:press_release", defaultText: "Quarterly Press Release: Your brand and products are featured in a press release distributed to our network of media partners." },
        ]
    }
];
