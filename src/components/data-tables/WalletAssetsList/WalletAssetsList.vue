<template>
    <div class="wallet-assets-list-dt">
        <f-data-table
            f-card-off
            :columns="columns"
            :items="items"
            first-m-v-column-width="6"
            class="f-data-table-body-bg-color"
        >
            <template v-slot:column-asset="{ value, item, column }">
                <div v-if="column" class="row no-collapse no-vert-col-padding">
                    <div class="col-6 f-row-label">{{ column.label }}</div>
                    <div class="col break-word">
                        <span>VAF</span>
                        <!-- <f-crypto-symbol :token="item" /> -->
                    </div>
                </div>
                <template v-else>
                    <span>VAF</span>
                    <!-- <f-crypto-symbol :token="item" /> -->
                </template>
            </template>

            <template v-slot:column-actions-account="{ value, item, column }">
                <div v-if="column" class="row no-collapse no-vert-col-padding">
                    <div class="col-6 f-row-label">{{ column.label }}</div>
                    <div class="col break-word">
                        <router-link
                            v-if="item.symbol === 'VAF'"
                            :to="{ name: 'account-send-erc20', params: { token: { ...item } } }"
                            class="action"
                            title="Send dd"
                        >
                            Send
                        </router-link>
                    </div>
                </div>
                <template v-else>
                    <router-link
                        v-if="item.symbol === 'VAF'"
                        :to="{ name: 'account-send-erc20', params: { token: { ...item } } }"
                        class="action"
                        title="Send VAF"
                    >
                        Send
                    </router-link>
                </template>
            </template>
        </f-data-table>
    </div>
</template>

<script>
import FDataTable from '@/components/core/FDataTable/FDataTable.vue';
// import FCryptoSymbol from '@/components/core/FCryptoSymbol/FCryptoSymbol.vue';
import { stringSort } from '@/utils/array-sorting.js';
import { formatNumberByLocale } from '@/filters.js';
import { cloneObject } from '@/utils';
import { MAX_TOKEN_DECIMALS_IN_TABLES } from '@/plugins/fantom-web3-wallet.js';

export default {
    name: 'WalletAssetsList',

    components: { FDataTable },

    props: {
        /** @type {ERC20Token[]} */
        tokens: {
            type: Array,
            required: true,
            default() {
                return [];
            },
        },
        /** @type {FMintAccount} */
        fMintAccount: {
            type: Object,
            required: true,
            default() {
                return {
                    collateral: [],
                    debt: [],
                };
            },
        },
    },

    data() {
        return {
            items: [],
            /** @type {DeFi} */
            defi: this.$defi,
            columns: [
                {
                    name: 'asset',
                    label: ' ',
                    sortFunc: (_itemProp, _direction = 'asc') => {
                        return (_a, _b) => {
                            const a = _a.symbol;
                            const b = _b.symbol;

                            return (_direction === 'desc' ? -1 : 1) * stringSort(a, b);
                        };
                    },
                    sortDir: 'desc',
                    width: '140px',
                },
                {
                    name: 'available',
                    label: '  ',
                    itemProp: 'availableBalance',
                    formatter: (_value, _item) => {
                        const balance = _item._availableBalance;

                        return balance > 0
                            ? formatNumberByLocale(
                                  balance,
                                  this.defi.getTokenDecimals(_item, MAX_TOKEN_DECIMALS_IN_TABLES)
                              )
                            : 0;
                    },
                    css: { textAlign: 'left' },
                    // width: '100px',
                },
                {
                    name: 'actions-account',
                    label: ' ',
                    width: '50%',
                    css: { textAlign: 'left' },
                },
            ],
        };
    },

    watch: {
        /**
         * @param {ERC20Token[]} _value
         */
        tokens(_value) {
            const value = cloneObject(_value);

            this.prepareTokens(value);

            this.items = value.filter((_token) => {
                return _token._availableBalance > 0 || _token._symbol === 'vAF';
            });

            this.$emit('records-count', this.items.length);
        },
    },

    methods: {
        /**
         * @param {ERC20Token[]} _tokens
         */
        prepareTokens(_tokens) {
            const { $defi } = this;

            if (_tokens) {
                _tokens.forEach((_token) => {
                    const availableBalance = _token.balanceOf || _token.availableBalance;

                    if (availableBalance) {
                        _token._availableBalance = $defi.fromTokenValue(availableBalance, _token);
                    } else {
                        _token._availableBalance = 0;
                    }
                });
            }
        },

        /**
         * @param {ERC20Token} _token
         * @return {*|number}
         */
        getCollateral(_token) {
            /** @type {FMintTokenBalance} */
            const tokenBalance = this.$defi.getFMintAccountCollateral(this.fMintAccount, _token);

            return this.$defi.fromTokenValue(tokenBalance.balance, _token) || 0;
        },

        /**
         * @param {ERC20Token} _token
         * @return {*|number}
         */
        getDebt(_token) {
            /** @type {FMintTokenBalance} */
            const tokenBalance = this.$defi.getFMintAccountDebt(this.fMintAccount, _token);

            return this.$defi.fromTokenValue(tokenBalance.balance, _token) || 0;
        },
    },
};
</script>
