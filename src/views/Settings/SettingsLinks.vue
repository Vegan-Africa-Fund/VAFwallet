<template>
    <div class="settingslinks">
        <f-card class="f-card-double-padding">
            <div class="small-container">
                <p>
                    <a href="https://veganafricafund.com/" target="_blank">
                        Vegan AF
                    </a>
                    <a href="https://wallet.veganafricafund.org/" target="_blank">
                        Ⓥwallet
                    </a>
                    powered by
                    <a href="https://fantom.foundation" target="_blank">
                        Fantom,
                    </a>
                    <a href="https://ftmscan.com" target="_blank">
                        FTMscan,
                    </a>
                    and
                    <a href="https://explorer.fantom.network/" target="_blank">
                        Fantom Explorer.
                    </a>
                </p>

                <social-media-links />
            </div>
        </f-card>
    </div>
</template>

<script>
import SocialMediaLinks from '@/components/SocialMediaLinks/SocialMediaLinks.vue';
import FCard from '@/components/core/FCard/FCard.vue';

export default {
    name: 'SettingsLinks',

    components: { FCard, SocialMediaLinks },
};
</script>
