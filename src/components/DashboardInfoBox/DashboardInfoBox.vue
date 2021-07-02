<template>
    <f-card class="dashboard-info-box info-box f-card-double-padding">
        <div class="row no-vert-col-padding align-items-center align-center-lg">
            <div class="col-5 col-12-lg align-right__ align-center-lg last-lg"><dashboard-actions-box /></div>
            <div class="col balances">
                <div class="balance">
                    <h3 class="align-center-lg">
                        <span>{{ accountsVAF }} <span class="ftm">VAF</span></span>
                    </h3>
                    <div class="label h3">Balance</div>
                </div>
                <div class="balance total-balance">
                    <h3 class="align-center-lg">
                        <span>{{ formatNumberByLocale(accountsBalance) }} <span class="ftm">FTM</span></span>
                    </h3>
                    <div class="label h3">Balance</div>
                </div>
            </div>
        </div>
    </f-card>
</template>

<script>
import FCard from '../core/FCard/FCard.vue';
import { formatCurrencyByLocale, formatNumberByLocale } from '../../filters.js';
import { toFTM, WEIToFTM } from '../../utils/transactions.js';
import { mapGetters } from 'vuex';
import DashboardActionsBox from '../DashboardActionsBox/DashboardActionsBox.vue';

export default {
    name: 'DashboardInfoBox',

    components: { DashboardActionsBox, FCard },

    computed: {
        ...mapGetters(['accounts']),
        accountsVAF() {
            let total = 0;
            for (let i = 0, len1 = this.accounts.length; i < len1; i++) {
                let bal = this.accounts[i].vafbalance;
                if (isNaN(bal)) {
                    console.log('not a good val');
                } else {
                    total += bal;
                }
            }
            return total;
        },

        accountsBalance() {
            return this.accounts.reduce((_total, _currItem) => {
                return _total + WEIToFTM(_currItem.balance);
            }, 0);
        },

        accountsTotalBalance() {
            return this.accounts.reduce((_total, _currItem) => {
                return _total + WEIToFTM(_currItem.totalBalance);
            }, 0);
        },
    },

    methods: {
        formatCurrencyByLocale,
        formatNumberByLocale,
        WEIToFTM,
        toFTM,
    },
};
</script>

<style lang="scss">
@import 'style';
</style>
