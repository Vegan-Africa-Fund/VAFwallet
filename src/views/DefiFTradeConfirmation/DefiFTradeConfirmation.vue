<template>
    <div class="defi-ftrade-confirmation">
        <tx-confirmation
            v-if="hasCorrectParams"
            :tx="tx"
            card-off
            :send-button-label="sendButtonLabel"
            :password-label="passwordLabel"
            :on-send-transaction-success="onSendTransactionSuccess"
            @change-component="onChangeComponent"
        >
            <h1 class="with-back-btn">
                <f-back-button
                    v-if="!params.steps || params.step === 1"
                    :route-name="backButtonRoute"
                    :params="{ fromToken: params.fromToken, toToken: params.toToken }"
                />
                Confirmation
                <template v-if="params.steps">({{ params.step }}/{{ params.steps }})</template>
            </h1>

            <div class="confirmation-info">
                <template v-if="params.step === 1">
                    You’re allowing
                    <span class="price">
                        {{ params.fromValue.toFixed($defi.getTokenDecimals(params.fromToken)) }} {{ fromTokenSymbol }}
                    </span>
                </template>
                <template v-else>
                    You're trading
                    <span class="price">
                        {{ params.fromValue.toFixed($defi.getTokenDecimals(params.fromToken)) }} {{ fromTokenSymbol }}
                    </span>
                    &#10141;
                    <span class="price">
                        {{ params.toValue.toFixed($defi.getTokenDecimals(params.toToken)) }} {{ toTokenSymbol }}
                    </span>
                </template>
            </div>

            <template #window-content>
                <ledger-confirmation-content :to="tx.to" :amount="0" />
            </template>
        </tx-confirmation>
        <template v-else>
            <f-message type="info" role="alert" class="big"> Trade tokens first, please. </f-message>
        </template>
    </div>
</template>

<script>
import TxConfirmation from '../../components/TxConfirmation/TxConfirmation.vue';
import LedgerConfirmationContent from '../../components/LedgerConfirmationContent/LedgerConfirmationContent.vue';
import { Web3 } from '../../plugins/fantom-web3-wallet.js';
import { mapGetters } from 'vuex';
import { toFTM } from '../../utils/transactions.js';
import FBackButton from '../../components/core/FBackButton/FBackButton.vue';
import { getAppParentNode } from '../../app-structure.js';
import FMessage from '../../components/core/FMessage/FMessage.vue';
import wftmUtils from 'fantom-ledgerjs/src/wftm-utils.js';
import erc20Utils from 'fantom-ledgerjs/src/erc20-utils.js';
import appConfig from '../../../app.config.js';

/**
 * Common component for DefiBorrowFUSDConfirmation a DefiManageBorrowConfirmation
 */
export default {
    name: 'DefiFTradeConfirmation',

    components: { FMessage, FBackButton, LedgerConfirmationContent, TxConfirmation },

    props: {
        /** Address of smart contract. */
        contractAddress: {
            type: String,
            default: '',
        },
    },

    data() {
        return {
            compName: 'defi-ftrade',
            priceDecimals: 6,
            tx: {},
        };
    },

    computed: {
        ...mapGetters(['currentAccount']),

        /**
         * @return {{fromValue: number, toValue: number, fromToken: DefiToken, toToken: DefiToken}}
         */
        params() {
            const { $route } = this;

            return $route && $route.params ? $route.params : {};
        },

        hasCorrectParams() {
            return !!this.params.fromValue;
        },

        increasedDebt() {
            return this.params.currDebt - this.params.debt;
        },

        decreasedDebt() {
            return this.params.debt - this.params.currDebt;
        },

        sendButtonLabel() {
            let label = '';

            if (this.params.step === 1) {
                label = 'Continue to the next step';
            } else {
                label = 'Submit';
                // label = 'Trade now';
            }

            return label;
        },

        passwordLabel() {
            let label = '';

            if (this.params.step === 1) {
                label = 'Please enter your wallet password to allow your tokens';
            } else {
                label = 'Please enter your wallet password to trade your tokens';
            }

            return label;
        },

        fromTokenSymbol() {
            return this.$defi.getTokenSymbol(this.params.fromToken);
        },

        toTokenSymbol() {
            return this.$defi.getTokenSymbol(this.params.toToken);
        },

        backButtonRoute() {
            const parentNode = getAppParentNode(`${this.compName}-confirmation`);

            return parentNode ? parentNode.id : '';
        },
    },

    created() {
        if (!this.hasCorrectParams) {
            // redirect to <this.compName>
            setTimeout(() => {
                this.$router.replace({ name: this.compName });
            }, 3000);
        } else {
            this.setTx();
        }
    },

    methods: {
        async setTx() {
            let { contractAddress } = this;

            const { params } = this;
            const { fromToken } = params;
            const { toToken } = params;
            let txToSign;
            let fromValue;

            /*
            console.log(
                fromToken,
                toToken,
                this.$defi.shiftDecPointRight(params.fromValue.toString(), fromToken.decimals),
                Web3.utils.toHex(this.$defi.shiftDecPointRight(params.fromValue.toString(), fromToken.decimals))
            );
            */

            if (!fromToken || !toToken) {
                return;
            }

            if (!contractAddress) {
                contractAddress = this.$defi.contracts.fMint;
            }

            if (this.params.step === 1) {
                fromValue = params.fromValue;

                if (fromToken.symbol === 'FUSD') {
                    // add 0.5% fee
                    fromValue += fromValue * 0.005;
                }

                txToSign = erc20Utils.erc20IncreaseAllowanceTx(
                    fromToken.address,
                    contractAddress,
                    Web3.utils.toHex(this.$defi.shiftDecPointRight((fromValue * 1.05).toString(), fromToken.decimals))
                );
            } else {
                if (fromToken.symbol === 'FTM' && toToken.canWrapFTM) {
                    txToSign = wftmUtils.defiWrapFtm(
                        toToken.address,
                        Web3.utils.toHex(this.$defi.shiftDecPointRight(params.toValue.toString(), toToken.decimals))
                    );
                } else if (fromToken.canWrapFTM && toToken.symbol === 'FTM') {
                    const amount = Web3.utils.toHex(
                        this.$defi.shiftDecPointRight(params.fromValue.toString(), toToken.decimals)
                    );

                    txToSign = wftmUtils.defiUnwrapFtm(
                        fromToken.address,
                        params.max || this.$defi.compareBN(amount, fromToken.availableBalance) === 1
                            ? fromToken.availableBalance
                            : amount
                    );
                }
                /* else if (fromToken.symbol === 'FUSD') {
                    txToSign = defiUtils.defiBuyTokenTx(
                        contractAddress,
                        toToken.address,
                        // Web3.utils.toHex(this.$defi.shiftDecPointRight(params.fromValue.toString(), fromToken.decimals))
                        Web3.utils.toHex(this.$defi.shiftDecPointRight(params.toValue.toString(), toToken.decimals))
                    );
                } else if (toToken.symbol === 'FUSD') {
                    txToSign = defiUtils.defiSellTokenTx(
                        contractAddress,
                        fromToken.address,
                        Web3.utils.toHex(this.$defi.shiftDecPointRight(params.fromValue.toString(), fromToken.decimals))
                    );
                } else {
                    txToSign = defiUtils.defiTradeTokenTx(
                        contractAddress,
                        fromToken.address,
                        toToken.address,
                        Web3.utils.toHex(this.$defi.shiftDecPointRight(params.fromValue.toString(), fromToken.decimals))
                        // parseInt(this.decreasedDebt * Math.pow(10, token.decimals))
                    );
                } */
            }

            if (txToSign) {
                this.tx = await this.$fWallet.getDefiTransactionToSign(txToSign, this.currentAccount.address);
            }
        },

        onSendTransactionSuccess(_data) {
            const params = {
                tx: _data.data.sendTransaction.hash,
                title: 'Success',
                continueTo: this.compName,
            };
            let transactionSuccessComp = `${this.compName}-transaction-success-message`;

            if (this.params.step === 1) {
                params.continueTo = `${this.compName}-confirmation2`;
                params.continueToParams = { ...this.params, step: 2 };
                params.autoContinueToAfter = appConfig.settings.autoContinueToAfter;
                params.continueButtonLabel = 'Next Step';
                params.title = `${this.params.step}/${this.params.steps}  ${params.title}`;
            } else if (this.params.step === 2) {
                transactionSuccessComp = `${this.compName}-transaction-success-message2`;
                params.continueToParams = {
                    fromToken: { ...this.params.fromToken },
                    toToken: { ...this.params.toToken },
                };
            }

            this.$router.replace({
                name: transactionSuccessComp,
                params,
            });
        },

        /**
         * Re-target `'change-component'` event.
         *
         * @param {object} _data
         */
        onChangeComponent(_data) {
            let transactionRejectComp = `${this.compName}-transaction-reject-message`;

            if (_data.to === 'transaction-reject-message') {
                if (this.params.step === 2) {
                    transactionRejectComp = `${this.compName}-transaction-reject-message2`;
                }

                this.$router.replace({
                    name: transactionRejectComp,
                    params: {
                        continueTo: this.compName,
                        continueToParams: {
                            fromToken: { ...this.params.fromToken },
                            toToken: { ...this.params.toToken },
                        },
                    },
                });
            }
        },

        toFTM,
    },
};
</script>

<style lang="scss">
@import 'style';
</style>
