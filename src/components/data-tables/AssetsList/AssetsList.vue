<template>
    <div class="assets-list-dt">
        <f-data-table
            :columns="columns"
            :items="items"
            first-m-v-column-width="6"
            f-card-off
            class="f-data-table-body-bg-color"
            :class="{ 'f-data-table-body-bg-color': defiAssetsList }"
        >
            <template v-slot:column-asset="{ value, item, column }">
                <div v-if="column" class="row no-collapse no-vert-col-padding">
                    <div class="col-6 f-row-label">{{ column.label }}</div>
                    <div class="col break-word">
                        <f-crypto-symbol :token="item" />
                    </div>
                </div>
                <template v-else>
                    <f-crypto-symbol :token="item" />
                </template>
            </template>

            <template v-slot:column-balance="{ value, item, column }">
                <div v-if="column" class="row no-collapse no-vert-col-padding">
                    <div class="col-6 f-row-label">{{ column.label }}</div>
                    <div class="col break-word">
                        {{ value }}
                        <!-- <span class="currency-light">{{ $defi.getTokenSymbol(item) }}</span>-->
                    </div>
                </div>
                <template v-else>
                    {{ value }}
                    <!-- <span class="currency-light">{{ $defi.getTokenSymbol(item) }}</span>-->
                </template>
            </template>

            <template v-slot:column-borrowed="{ value, item, column }">
                <div v-if="column" class="row no-collapse no-vert-col-padding">
                    <div class="col-6 f-row-label">{{ column.label }}</div>
                    <div class="col break-word">
                        {{ value }}
                        <!-- <span class="currency-light">{{ $defi.getTokenSymbol(item) }}</span>-->
                    </div>
                </div>
                <template v-else>
                    {{ value }}
                    <!-- <span class="currency-light">{{ $defi.getTokenSymbol(item) }}</span>-->
                </template>
            </template>

            <template v-slot:column-actions="{ value, item, column }">
                <div v-if="column" class="row no-collapse no-vert-col-padding">
                    <div class="col-6 f-row-label">{{ column.label }}</div>
                    <div class="col break-word">
                        <template v-if="usedAsCollateral(item)">
                            <router-link :to="{ name: 'defi-lock', params: { tokenAddress: item.address } }">
                                Lock
                            </router-link>
                            <template v-if="item._collateral > 0">
                                ,
                                <router-link :to="{ name: 'defi-unlock', params: { tokenAddress: item.address } }">
                                    Unlock
                                </router-link>
                            </template>
                            <template v-if="item.symbol === 'WFTM'">
                                ,
                                <router-link :to="{ name: 'defi-ftrade' }">Swap</router-link>
                            </template>
                        </template>
                        <template v-if="item.canMint">
                            <router-link :to="{ name: 'defi-mint', params: { tokenAddress: item.address } }">
                                Mint
                            </router-link>
                            <template v-if="item._debt > 0">
                                ,
                                <router-link :to="{ name: 'defi-repay', params: { tokenAddress: item.address } }">
                                    Repay
                                </router-link>
                            </template>
                        </template>
                    </div>
                </div>
                <template v-else>
                    <template v-if="usedAsCollateral(item)">
                        <router-link :to="{ name: 'defi-lock', params: { tokenAddress: item.address } }">
                            Lock
                        </router-link>
                        <template v-if="item._collateral > 0">
                            <br />
                            <router-link :to="{ name: 'defi-unlock', params: { tokenAddress: item.address } }">
                                Unlock
                            </router-link>
                        </template>
                        <template v-if="item.symbol === 'WFTM'">
                            <br />
                            <router-link :to="{ name: 'defi-ftrade' }">Swap</router-link>
                        </template>
                    </template>
                    <template v-if="item.canMint">
                        <router-link :to="{ name: 'defi-mint', params: { tokenAddress: item.address } }">
                            Mint
                        </router-link>
                        <template v-if="item._debt > 0">
                            <br />
                            <router-link :to="{ name: 'defi-repay', params: { tokenAddress: item.address } }">
                                Repay
                            </router-link>
                        </template>
                    </template>
                </template>
            </template>

            <template v-slot:column-actions-account="{ value, item, column }">
                <div v-if="column" class="row no-collapse no-vert-col-padding">
                    <div class="col-6 f-row-label">{{ column.label }}</div>
                    <div class="col break-word">
                        <router-link
                            v-if="item.symbol !== 'SFTM'"
                            :to="{ name: 'account-send-erc20', params: { token: { ...item } } }"
                            class="action"
                            title="Send zz"
                        >
                            Send aa
                        </router-link>
                    </div>
                </div>
                <template v-else>
                    <router-link
                        v-if="item.symbol !== 'SFTM'"
                        :to="{ name: 'account-send-erc20', params: { token: { ...item } } }"
                        class="action"
                        title="Send cc"
                    >
                        Send bb
                    </router-link>
                </template>
            </template>
        </f-data-table>
    </div>
</template>

<script>
import FDataTable from '@/components/core/FDataTable/FDataTable.vue';
import FCryptoSymbol from '@/components/core/FCryptoSymbol/FCryptoSymbol.vue';
import { stringSort } from '@/utils/array-sorting.js';
import { formatNumberByLocale } from '@/filters.js';
import { MAX_TOKEN_DECIMALS_IN_TABLES } from '@/plugins/fantom-web3-wallet.js';

export default {
    name: 'AssetsList',

    components: { FCryptoSymbol, FDataTable },

    props: {
        /** @type {DefiToken[]} */
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
        /** Assets list used in defi module. */
        defiAssetsList: {
            type: Boolean,
            default: false,
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
                    label: 'Asset',
                    sortFunc: (_itemProp, _direction = 'asc') => {
                        return (_a, _b) => {
                            const a = _a.symbol;
                            const b = _b.symbol;

                            return (_direction === 'desc' ? -1 : 1) * stringSort(a, b);
                        };
                    },
                    sortDir: 'desc',
                    width: '180px',
                },
                {
                    name: 'available',
                    label: 'Available',
                    itemProp: 'availableBalance',
                    formatter: (_availableBalance, _item) => {
                        const balance = this.$defi.fromTokenValue(_availableBalance, _item);

                        return balance > 0
                            ? formatNumberByLocale(
                                  balance,
                                  this.defi.getTokenDecimals(_item, MAX_TOKEN_DECIMALS_IN_TABLES)
                              )
                            : 0;
                    },
                    css: { textAlign: 'center' },
                    // width: '100px',
                },
                {
                    name: 'balance',
                    label: 'Deposited',
                    itemProp: 'availableBalance',
                    formatter: (_availableBalance, _item) => {
                        const collateral = this.getCollateral(_item);

                        return collateral > 0
                            ? formatNumberByLocale(
                                  collateral,
                                  this.defi.getTokenDecimals(_item, MAX_TOKEN_DECIMALS_IN_TABLES)
                              )
                            : 0;
                    },
                    css: { textAlign: 'center' },
                    // width: '100px',
                },
                {
                    name: 'borrowed',
                    label: 'Borrowed',
                    hidden: !this.defiAssetsList,
                    formatter: (_value, _item) => {
                        const debt = this.getDebt(_item);

                        return debt > 0
                            ? formatNumberByLocale(
                                  debt,
                                  this.defi.getTokenDecimals(_item, MAX_TOKEN_DECIMALS_IN_TABLES)
                              )
                            : 0;
                    },
                    css: { textAlign: 'center' },
                },
                {
                    name: 'totalSupply',
                    label: 'Supply',
                    hidden: !this.defiAssetsList,
                    formatter: (_value, _item) => {
                        return formatNumberByLocale(
                            this.$defi.fromTokenValue(_value, _item),
                            this.defi.getTokenDecimals(_item, MAX_TOKEN_DECIMALS_IN_TABLES)
                        );
                    },
                    css: { textAlign: 'center' },
                },
                {
                    name: 'actions',
                    label: 'Actions',
                    hidden: !this.defiAssetsList,
                    width: '120px',
                    css: { textAlign: 'right' },
                },
                {
                    name: 'actions-account',
                    label: 'Actions',
                    hidden: this.defiAssetsList,
                    width: '120px',
                    css: { textAlign: 'right' },
                },
            ],
        };
    },

    watch: {
        /**
         * @param {DefiToken[]} _value
         */
        tokens(_value) {
            let tokens = _value.filter((_item) => {
                return _item.isActive && (_item.canDeposit || _item.canMint) && _item.symbol !== 'FTM';
            });

            tokens.forEach((_item) => {
                const collateral = this.getCollateral(_item);
                const debt = this.getDebt(_item);

                // store collateral and debt for later use
                _item._collateral = collateral;
                _item._debt = debt;
            });

            this.items = tokens;

            this.$emit('records-count', this.items.length);
        },
    },

    methods: {
        /**
         * @param {DefiToken} _token
         * @return {*|number}
         */
        getCollateral(_token) {
            /** @type {FMintTokenBalance} */
            const tokenBalance = this.$defi.getFMintAccountCollateral(this.fMintAccount, _token);

            return this.$defi.fromTokenValue(tokenBalance.balance, _token) || 0;
        },

        /**
         * @param {DefiToken} _token
         * @return {*|number}
         */
        getDebt(_token) {
            /** @type {FMintTokenBalance} */
            const tokenBalance = this.$defi.getFMintAccountDebt(this.fMintAccount, _token);

            return this.$defi.fromTokenValue(tokenBalance.balance, _token) || 0;
        },

        /**
         * @param {DefiToken} _token
         * @return {boolean}
         */
        usedInFMint(_token) {
            return this.usedAsCollateral(_token) || _token.symbol === 'FUSD';
        },

        /**
         * @param {DefiToken} _token
         * @return {boolean}
         */
        usedAsCollateral(_token) {
            return _token.symbol === 'WFTM' || _token.symbol === 'SFTM';
        },
    },
};
</script>
